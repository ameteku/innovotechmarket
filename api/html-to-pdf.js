import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { Unkey } from '@unkey/api';
import { put } from '@vercel/blob';

// ===================== CONFIGURATION =====================
const CONFIG = {
  // Unkey — https://app.unkey.com
  UNKEY_API_ID: process.env.UNKEY_API_ID,
  UNKEY_ROOT_KEY: process.env.UNKEY_ROOT_KEY,
};
// =========================================================

/**
 * Vercel Serverless Function
 *
 * GET  /api/html-to-pdf  → health check
 * POST /api/html-to-pdf  → render HTML to PDF, upload to Vercel Blob, return URL
 *
 * Headers:
 *   Authorization: Bearer <unkey-api-key>
 *   Content-Type: application/json
 *
 * Body (JSON):
 *   html      – raw HTML string to render (required)
 *   filename  – base filename without extension (optional, default: "document")
 */
export default async function handler(req, res) {
  // --- Health check ---
  if (req.method === 'GET') {
    return res.json({
      status: 'ok',
      endpoint: 'POST /api/html-to-pdf',
      body: {
        html: 'string (required) — raw HTML to render as PDF',
        filename: 'string (optional) — base filename without extension (default: "document")',
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
  const { html, filename = 'document' } = req.body ?? {};

  if (!html || typeof html !== 'string' || !html.trim()) {
    return res.status(400).json({ error: 'html is required and must be a non-empty string' });
  }

  let browser;
  try {
    // ── Step 1: Launch headless Chromium ──
    console.log('[1/3] Launching Chromium...');
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    // ── Step 2: Render HTML to PDF ──
    console.log('[2/3] Rendering HTML to PDF...');
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    console.log(`[2/3] PDF generated: ${pdfBuffer.length} bytes`);

    // ── Step 3: Upload to Vercel Blob (5-day TTL) ──
    const fileName = `${filename}_${Date.now()}.pdf`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5);

    const blob = await put(fileName, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: true,
      expiresAt,
    });
    console.log(`[3/3] Uploaded: ${blob.url} (expires ${expiresAt.toISOString()})`);

    return res.json({
      success: true,
      url: blob.url,
      fileName,
      expiresAt: expiresAt.toISOString(),
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
  } finally {
    if (browser) await browser.close();
  }
}
