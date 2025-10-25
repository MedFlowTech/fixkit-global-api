import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(_req: VercelRequest, res: VercelResponse) {
res.setHeader('Cache-Control', 'no-store');
return res.status(200).json({ ok: true, region: process.env.VERCEL_REGION || 'unknown' });
}