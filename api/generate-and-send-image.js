// openai SDK not needed — we call the REST API directly to avoid multipart upload issues
import { Unkey } from '@unkey/api';
import { put, del } from '@vercel/blob';

// ===================== CONFIGURATION =====================
const CONFIG = {
  // OpenAI — https://platform.openai.com/api-keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  // Green API — https://console.green-api.com
  GREEN_API_INSTANCE_ID: process.env.GREEN_API_INSTANCE_ID?.trim(),
  GREEN_API_TOKEN: process.env.GREEN_API_TOKEN?.trim(),

  // WhatsApp group chat ID, e.g. "120363XXXXXXXXXX@g.us"
  GROUP_CHAT_ID: (process.env.GROUP_CHAT_ID || '120363XXXXXXXXXX@g.us').trim(),

  // Unkey — https://app.unkey.com
  UNKEY_API_ID: process.env.UNKEY_API_ID,
  UNKEY_ROOT_KEY: process.env.UNKEY_ROOT_KEY,
};
// =========================================================

/**
 * Vercel Serverless Function
 *
 * GET  /api/generate-and-send-image  → health check
 * POST /api/generate-and-send-image  → edit image with AI & send to WhatsApp group
 *
 * Headers:
 *   Authorization: Bearer <unkey-api-key>
 *   Content-Type: application/json
 *
 * Body (JSON):
 *   image_url  – publicly accessible URL of the source image (required)
 *   prompt     – description of desired edits / new image (required)
 *   size       – output size: "1024x1024" | "1536x1024" | "1024x1536" (default: "1024x1024")
 */
export default async function handler(req, res) {
  // --- Health check ---
  if (req.method === 'GET') {
    return res.json({
      status: 'ok',
      endpoint: 'POST /api/generate-and-send-image',
      body: {
        image_url: 'string (required) — public URL of source image',
        prompt: 'string (required) — edit instructions',
        size: '"1024x1024" | "1536x1024" | "1024x1536" (optional, default: 1024x1024)',
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
      code: keyResult.code,
    });
  }

  // --- Parse body ---
  const { image_url, prompt, size = '1024x1024' } = req.body ?? {};

  if (!image_url) {
    return res.status(400).json({ error: 'image_url is required' });
  }
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const validSizes = ['1024x1024', '1536x1024', '1024x1536'];
  if (!validSizes.includes(size)) {
    return res.status(400).json({ error: `size must be one of: ${validSizes.join(', ')}` });
  }

  try {
    // ── Step 1: Fetch the source image ──
    console.log(`[1/4] Fetching source image from: ${image_url}`);
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: HTTP ${imageResponse.status}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
    console.log(`[1/4] Fetched ${imageBuffer.length} bytes (${contentType})`);

    // ── Step 2: Generate edited image with OpenAI gpt-image-1 ──
    console.log(`[2/4] Generating image with prompt: "${prompt}". API key present: ${!!CONFIG.OPENAI_API_KEY}, length: ${CONFIG.OPENAI_API_KEY?.length}`);

    // Build FormData for the OpenAI images/edits REST endpoint
    console.log(`[2/4] Building FormData (${imageBuffer.length} bytes, content-type=${contentType})`);
    const formData = new FormData();
    // gpt-image-1 accepts JPEG/PNG/WebP; always send as PNG for consistency
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('image', imageBlob, `source.png`);
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', prompt);
    formData.append('n', '1');
    formData.append('size', size);

    console.log(`[2/4] Posting to OpenAI images/edits...`);
    const editRes = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${CONFIG.OPENAI_API_KEY}` },
      body: formData,
    });
    const editJson = await editRes.json();
    if (!editRes.ok) {
      throw new Error(`OpenAI API error ${editRes.status}: ${JSON.stringify(editJson.error ?? editJson)}`);
    }
    console.log(`[2/4] OpenAI responded OK`);

    const b64 = editJson.data[0].b64_json;
    const generatedBuffer = Buffer.from(b64, 'base64');
    const fileName = `image_${Date.now()}.png`;
    console.log(`[2/4] Generated ${generatedBuffer.length} bytes → "${fileName}"`);

    // ── Step 3: Upload to Vercel Blob for a temporary public URL ──
    const blob = await put(fileName, generatedBuffer, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: true,
    });
    console.log(`[3/4] Hosted at ${blob.url}. Sending to WhatsApp...`);

    // ── Step 4: Send via Green API sendFileByUrl ──
    const greenApiUrl = `https://${String(CONFIG.GREEN_API_INSTANCE_ID).slice(0, 4)}.api.greenapi.com/waInstance${CONFIG.GREEN_API_INSTANCE_ID}/sendFileByUrl/${CONFIG.GREEN_API_TOKEN}`;

    const greenRes = await fetch(greenApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: CONFIG.GROUP_CHAT_ID,
        urlFile: blob.url,
        fileName,
        caption: `🎨 ${prompt}`,
      }),
    });
    if (!greenRes.ok) throw new Error(`Green API ${greenRes.status}: ${await greenRes.text()}`);
    const greenJson = await greenRes.json();

    // Delete blob after a delay to give Green API time to download it
    setTimeout(() => del(blob.url).catch(() => {}), 60000);

    const { idMessage } = greenJson;
    console.log(`[4/4] Sent! WhatsApp message ID: ${idMessage}`);

    return res.json({
      success: true,
      message: 'Image generated and sent to WhatsApp group',
      messageId: idMessage,
      fileName,
    });
  } catch (err) {
    const details = {
      message: err.message,
      status: err.status,
      code: err.code,
      type: err.type,
      body: err.error,
    };
    console.error('[Error]', JSON.stringify(details));
    return res.status(500).json({ success: false, error: err.message, details });
  }
}
