import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { Unkey } from '@unkey/api';
import { put, del } from '@vercel/blob';

// ===================== CONFIGURATION =====================
// Set these as Vercel Environment Variables (Project Settings → Environment Variables)
// or hardcode below for local testing only.

const CONFIG = {
  // ElevenLabs — https://elevenlabs.io/app/settings/api-keys
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,

  // Green API — https://console.green-api.com (idInstance + apiTokenInstance)
  GREEN_API_INSTANCE_ID: process.env.GREEN_API_INSTANCE_ID?.trim(),
  GREEN_API_TOKEN: process.env.GREEN_API_TOKEN?.trim(),

  // WhatsApp group chat ID, e.g. "120363XXXXXXXXXX@g.us"
  // Get it: in the Green API console → Chats → copy the group's chatId
  GROUP_CHAT_ID: (process.env.GROUP_CHAT_ID || '120363XXXXXXXXXX@g.us').trim(),

  // Unkey — https://app.unkey.com → APIs → create an API → copy the apiId
  UNKEY_API_ID: process.env.UNKEY_API_ID,

  // Unkey root key — https://app.unkey.com → Settings → Root Keys → create with verify_key permission
  UNKEY_ROOT_KEY: process.env.UNKEY_ROOT_KEY,
};
// =========================================================

/**
 * Convert whatever the ElevenLabs SDK returns (async iterable, ReadableStream,
 * Buffer, or Uint8Array) into a Node.js Buffer.
 */
async function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);

  // Async iterable — the most common SDK return type
  if (data?.[Symbol.asyncIterator]) {
    const chunks = [];
    for await (const chunk of data) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  // Web ReadableStream (Node 18+)
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
 * GET  /api/generate-and-send  → health check
 * POST /api/generate-and-send  → generate song & send to WhatsApp group
 *
 * Headers:
 *   Authorization: Bearer <unkey-api-key>
 *   Content-Type: application/json
 *
 * Body (JSON, all optional):
 *   prompt         – description of the song  (default: upbeat electronic)
 *   music_length_ms – duration in ms          (default: 30000 = 30 s)
 */
export default async function handler(req, res) {
  // --- Health check ---
  if (req.method === 'GET') {
    return res.json({
      status: 'ok',
      endpoint: 'POST /api/generate-and-send',
      body: { prompt: 'string (optional)', music_length_ms: 'number ms (optional)', lyrics: 'string newline-separated (optional)' },
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
    return res.status(401).json({
      error: 'Missing API key. Add header: Authorization: Bearer <your-key>',
    });
  }

  let keyResult;
  try {
    const unkey = new Unkey({ rootKey: CONFIG.UNKEY_ROOT_KEY });
    const response = await unkey.keys.verifyKey({ key: apiKey, apiId: CONFIG.UNKEY_API_ID });
    keyResult = response.data;
  } catch (keyError) {
    console.error('[Unkey] Verification error:', keyError.message);
    return res.status(500).json({ error: 'Key verification failed', details: keyError.message });
  }

  if (!keyResult.valid) {
    return res.status(401).json({
      error: 'Invalid or expired API key',
      code: keyResult.code, // e.g. NOT_FOUND, RATE_LIMITED, EXPIRED
    });
  }

  // --- Parse body ---
  const {
    prompt = 'Upbeat electronic music with synth, bass, and drums',
    music_length_ms = 30000,
    lyrics = null,   // optional: newline-separated lyrics string
  } = req.body ?? {};

  try {
    // ── Step 1: Generate music with ElevenLabs ──
    console.log(`[1/3] Generating music: "${prompt}" (lyrics: ${lyrics ? 'yes' : 'no'})`);

    const elevenlabs = new ElevenLabsClient({ apiKey: CONFIG.ELEVENLABS_API_KEY });

    const composeParams = lyrics
      ? {
          compositionPlan: {
            positiveGlobalStyles: [prompt, 'vocals', 'singing', 'male vocalist'],
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
      : { prompt, musicLengthMs: music_length_ms };

    const audioData = await elevenlabs.music.compose(composeParams);

    const audioBuffer = await toBuffer(audioData);
    const fileName = `song_${Date.now()}.mp3`;

    console.log(`[2/3] Generated ${audioBuffer.length} bytes → "${fileName}". First bytes: ${audioBuffer.subarray(0,4).toString('hex')}. Uploading to WhatsApp...`);

    // ── Step 2a: Store audio in Vercel Blob for a temporary public URL ──
    const blob = await put(fileName, audioBuffer, { access: 'public', contentType: 'audio/mpeg', addRandomSuffix: true });
    console.log(`[2b/3] Hosted at ${blob.url}. Sending to WhatsApp...`);

    // ── Step 2b: Send via Green API sendFileByUrl, then clean up blob ──
    const greenApiUrl = `https://${String(CONFIG.GREEN_API_INSTANCE_ID).slice(0, 4)}.api.greenapi.com/waInstance${CONFIG.GREEN_API_INSTANCE_ID}/sendFileByUrl/${CONFIG.GREEN_API_TOKEN}`;

    const greenRes = await fetch(greenApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: CONFIG.GROUP_CHAT_ID, urlFile: blob.url, fileName, caption: `🎵 ${prompt}` }),
    });
    if (!greenRes.ok) throw new Error(`Green API ${greenRes.status}: ${await greenRes.text()}`);
    const greenJson = await greenRes.json();

    // Delete blob after a delay to give Green API time to download it
    setTimeout(() => del(blob.url).catch(() => {}), 60000);

    const { idMessage, urlFile } = greenJson;
    console.log(`[3/3] Sent! WhatsApp message ID: ${idMessage}`);

    return res.json({
      success: true,
      message: 'Song generated and sent to WhatsApp group',
      messageId: idMessage,
      fileUrl: urlFile,
      fileName,
    });
  } catch (err) {
    console.error('[Error]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
