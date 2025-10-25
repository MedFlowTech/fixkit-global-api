import type { VercelRequest, VercelResponse } from '@vercel/node';

// Placeholder: Cloud background removal endpoint
// (frontend already handles local removal — this adds global fallback)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ Allow cross-domain access from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse uploaded file
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Uint8Array);
    }
    const buffer = Buffer.concat(chunks);

    // Placeholder response (no heavy AI backend yet)
    // You can later connect this to a real background-removal service or AI model.
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      ok: true,
      message: 'Background removal (cloud mode) received file successfully.',
      size: buffer.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Background removal failed' });
  }
}
