import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(_req: VercelRequest, res: VercelResponse) {
return res.status(501).json({ ok: false, message: 'Background removal via cloud coming soon. Local mode works today.' });
}