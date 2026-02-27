import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { Unkey } from '@unkey/api';
import { put, del } from '@vercel/blob';

// ===================== CONFIGURATION =====================
const CONFIG = {
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GREEN_API_INSTANCE_ID: process.env.GREEN_API_INSTANCE_ID?.trim(),
  GREEN_API_TOKEN: process.env.GREEN_API_TOKEN?.trim(),
  GROUP_CHAT_ID: (process.env.GROUP_CHAT_ID || '120363XXXXXXXXXX@g.us').trim(),
  UNKEY_API_ID: process.env.UNKEY_API_ID,
  UNKEY_ROOT_KEY: process.env.UNKEY_ROOT_KEY,
};
// =========================================================

async function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (data?.[Symbol.asyncIterator]) {
    const chunks = [];
    for await (const chunk of data) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  if (typeof ReadableStream !== 'undefined' && data instanceof ReadableStream) {
    const reader = data.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }
  throw new Error(`Unsupported audio data type: ${Object.prototype.toString.call(data)}`);
}

/**
 * Vercel Serverless Function
 *
 * GET  /api/generate-and-send-all  → health check
 * POST /api/generate-and-send-all  → fire off music + image pipelines independently,
 *                                    each generates → uploads → delivers based on `deliver` param.
 *
 * Headers:
 *   Authorization: Bearer <unkey-api-key>
 *   Content-Type: application/json
 *
 * Body (JSON):
 *   music_prompt     – music style description              (optional, has default)
 *   music_length_ms  – duration in ms                      (optional, default 30000)
 *   lyrics           – newline-separated lyrics            (optional)
 *   image_url        – public URL of source image          (required)
 *   image_prompt     – image edit instructions             (required)
 *   image_size       – "1024x1024"|"1536x1024"|"1024x1536" (optional)
 *   deliver          – "whatsapp"|"link"|"both"            (optional, default "whatsapp")
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json({
      status: 'ok',
      endpoint: 'POST /api/generate-and-send-all',
      body: {
        music_prompt: 'string (optional)',
        music_length_ms: 'number ms (optional, default 30000)',
        lyrics: 'string newline-separated (optional)',
        image_url: 'string (required) — public URL of source image',
        image_prompt: 'string (required) — edit instructions',
        image_size: '"1024x1024" | "1536x1024" | "1024x1536" (optional)',
        deliver: '"whatsapp" (default) | "link" | "both"',
      },
      auth: 'Authorization: Bearer <unkey-api-key>',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Unkey API key verification ---
  const authHeader = req.headers['authorization'];
  const apiKey = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key. Add header: Authorization: Bearer <your-key>' });
  }

  let keyResult;
  try {
    const unkey = new Unkey({ rootKey: CONFIG.UNKEY_ROOT_KEY });
    const response = await unkey.keys.verifyKey({ key: apiKey, apiId: CONFIG.UNKEY_API_ID });
    keyResult = response.data;
  } catch (keyError) {
    return res.status(500).json({ error: 'Key verification failed', details: keyError.message });
  }

  if (!keyResult.valid) {
    return res.status(401).json({ error: 'Invalid or expired API key', code: keyResult.code });
  }

  // --- Parse body ---
  const {
    music_prompt = 'Upbeat electronic music with synth, bass, and drums',
    music_length_ms = 30000,
    lyrics = null,
    image_url,
    image_prompt,
    image_size = '1024x1024',
    deliver = 'whatsapp',
  } = req.body ?? {};

  if (!image_url) return res.status(400).json({ error: 'image_url is required' });
  if (!image_prompt) return res.status(400).json({ error: 'image_prompt is required' });

  const validSizes = ['1024x1024', '1536x1024', '1024x1536'];
  if (!validSizes.includes(image_size)) {
    return res.status(400).json({ error: `image_size must be one of: ${validSizes.join(', ')}` });
  }

  const validDelivers = ['whatsapp', 'link', 'both'];
  if (!validDelivers.includes(deliver)) {
    return res.status(400).json({ error: `deliver must be one of: ${validDelivers.join(', ')}` });
  }

  const sendViaWhatsApp = deliver === 'whatsapp' || deliver === 'both';
  const sendViaLink = deliver === 'link' || deliver === 'both';

  const greenApiUrl = `https://${String(CONFIG.GREEN_API_INSTANCE_ID).slice(0, 4)}.api.greenapi.com/waInstance${CONFIG.GREEN_API_INSTANCE_ID}/sendFileByUrl/${CONFIG.GREEN_API_TOKEN}`;

  const sendToWhatsApp = async (blobUrl, fileName, caption) => {
    const r = await fetch(greenApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: CONFIG.GROUP_CHAT_ID, urlFile: blobUrl, fileName, caption }),
    });
    if (!r.ok) throw new Error(`Green API ${r.status}: ${await r.text()}`);
    return r.json();
  };

  // ── Music pipeline: generate → upload blob only (no delivery) ──
  const musicPipeline = async () => {
    const elevenlabs = new ElevenLabsClient({ apiKey: CONFIG.ELEVENLABS_API_KEY });
    const composeParams = lyrics
      ? {
          compositionPlan: {
            positiveGlobalStyles: [music_prompt, 'vocals', 'singing', 'male vocalist'],
            negativeGlobalStyles: ['instrumental'],
            sections: [{
              sectionName: 'verse',
              positiveLocalStyles: ['vocals', 'singing'],
              negativeLocalStyles: ['instrumental'],
              durationMs: music_length_ms,
              lines: lyrics.split('\n').map(l => l.trim()).filter(Boolean),
            }],
          },
        }
      : { prompt: music_prompt, musicLengthMs: music_length_ms };

    console.log(`[music] Generating...`);
    const audioData = await elevenlabs.music.compose(composeParams);
    const audioBuffer = await toBuffer(audioData);
    const fileName = `song_${Date.now()}.mp3`;
    console.log(`[music] Generated ${audioBuffer.length} bytes. Uploading...`);

    const blob = await put(fileName, audioBuffer, { access: 'public', contentType: 'audio/mpeg', addRandomSuffix: true });
    console.log(`[music] Uploaded: ${blob.url}`);
    return { blobUrl: blob.url, fileName, prompt: music_prompt };
  };

  // ── Image pipeline: fetch → edit → upload blob only (no delivery) ──
  const imagePipeline = async () => {
    console.log(`[image] Fetching source image...`);
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) throw new Error(`Failed to fetch image: HTTP ${imageResponse.status}`);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    console.log(`[image] Fetched ${imageBuffer.length} bytes. Editing with OpenAI...`);

    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), 'source.png');
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', image_prompt);
    formData.append('n', '1');
    formData.append('size', image_size);

    const editRes = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${CONFIG.OPENAI_API_KEY}` },
      body: formData,
    });
    const editJson = await editRes.json();
    if (!editRes.ok) throw new Error(`OpenAI error ${editRes.status}: ${JSON.stringify(editJson.error ?? editJson)}`);

    const generatedBuffer = Buffer.from(editJson.data[0].b64_json, 'base64');
    const fileName = `image_${Date.now()}.png`;
    console.log(`[image] Generated ${generatedBuffer.length} bytes. Uploading...`);

    const blob = await put(fileName, generatedBuffer, { access: 'public', contentType: 'image/png', addRandomSuffix: true });
    console.log(`[image] Uploaded: ${blob.url}`);
    return { blobUrl: blob.url, fileName, prompt: image_prompt };
  };

  // ── Fire both pipelines independently — neither waits on the other ──
  const [musicOutcome, imageOutcome] = await Promise.allSettled([
    musicPipeline(),
    imagePipeline(),
  ]);

  const musicData = musicOutcome.status === 'fulfilled' ? musicOutcome.value : null;
  const imageData = imageOutcome.status === 'fulfilled' ? imageOutcome.value : null;

  const music = {};
  const image = {};

  // ── WhatsApp delivery ──
  if (sendViaWhatsApp) {
    if (musicData) {
      try {
        const green = await sendToWhatsApp(musicData.blobUrl, musicData.fileName, `🎵 ${musicData.prompt}`);
        music.success = true;
        music.messageId = green.idMessage;
        music.fileName = musicData.fileName;
        console.log(`[music] Sent to WhatsApp! messageId=${green.idMessage}`);
      } catch (e) {
        music.success = false;
        music.error = e.message;
      }
    } else {
      music.success = false;
      music.error = musicOutcome.reason?.message ?? 'Unknown error';
    }

    if (imageData) {
      try {
        const green = await sendToWhatsApp(imageData.blobUrl, imageData.fileName, '');
        image.success = true;
        image.messageId = green.idMessage;
        image.fileName = imageData.fileName;
        console.log(`[image] Sent to WhatsApp! messageId=${green.idMessage}`);
      } catch (e) {
        image.success = false;
        image.error = e.message;
      }
    } else {
      image.success = false;
      image.error = imageOutcome.reason?.message ?? 'Unknown error';
    }

    // Only delete blobs when NOT also creating a hosted link (link needs them alive)
    if (!sendViaLink) {
      if (musicData) setTimeout(() => del(musicData.blobUrl).catch(() => {}), 60000);
      if (imageData) setTimeout(() => del(imageData.blobUrl).catch(() => {}), 60000);
    }
  } else {
    // Not sending to WhatsApp — report pipeline results only
    music.success = musicData !== null;
    if (!musicData) music.error = musicOutcome.reason?.message ?? 'Unknown error';
    if (musicData) music.fileName = musicData.fileName;

    image.success = imageData !== null;
    if (!imageData) image.error = imageOutcome.reason?.message ?? 'Unknown error';
    if (imageData) image.fileName = imageData.fileName;
  }

  // ── Hosted result page ──
  let result_url;
  if (sendViaLink && (musicData || imageData)) {
    const id = crypto.randomUUID();
    const metadata = {
      id,
      created_at: new Date().toISOString(),
      ...(musicData && { music: { url: musicData.blobUrl, prompt: musicData.prompt, fileName: musicData.fileName } }),
      ...(imageData && { image: { url: imageData.blobUrl, prompt: imageData.prompt, fileName: imageData.fileName } }),
    };

    await put(`result_${id}.json`, JSON.stringify(metadata), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    result_url = `https://innovotechmarket.vercel.app/result/${id}`;
    console.log(`[result] Stored metadata. result_url=${result_url}`);
  }

  const overallSuccess = music.success || image.success;

  return res.status(overallSuccess ? 200 : 500).json({
    success: overallSuccess,
    music,
    image,
    ...(result_url && { result_url }),
  });
}
