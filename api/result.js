import { list } from '@vercel/blob';

/**
 * Vercel Serverless Function
 *
 * GET /api/result?id=<uuid>  → returns result metadata (public, no auth)
 *
 * Response:
 *   {
 *     id: string,
 *     created_at: string,
 *     music?: { url, prompt, fileName },
 *     image?: { url, prompt, fileName }
 *   }
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'id query parameter is required' });
  }

  // Validate UUID format to prevent path traversal / injection
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id format' });
  }

  try {
    const { blobs } = await list({ prefix: `result_${id}.json` });

    if (!blobs.length) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const metaResponse = await fetch(blobs[0].url);
    if (!metaResponse.ok) {
      return res.status(404).json({ error: 'Result data unavailable' });
    }

    const metadata = await metaResponse.json();
    return res.json(metadata);
  } catch (err) {
    console.error('[result] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch result', details: err.message });
  }
}
