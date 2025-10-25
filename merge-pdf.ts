import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PDFDocument } from 'pdf-lib';
import Busboy from 'busboy';


function parseForm(req: VercelRequest): Promise<Buffer[]> {
return new Promise((resolve, reject) => {
const files: Buffer[] = [];
const bb = Busboy({ headers: req.headers });
bb.on('file', (_name, file) => {
const chunks: Buffer[] = [];
file.on('data', (d: Buffer) => chunks.push(d));
file.on('end', () => files.push(Buffer.concat(chunks)));
});
bb.on('error', reject);
bb.on('finish', () => resolve(files));
req.pipe(bb as any);
});
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
try {
const files = await parseForm(req);
if (!files.length) return res.status(400).send('No files');
const out = await PDFDocument.create();
for (const buf of files) {
const src = await PDFDocument.load(new Uint8Array(buf));
const pages = await out.copyPages(src, src.getPageIndices());
pages.forEach(p => out.addPage(p));
}
const merged = await out.save();
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', 'attachment; filename="fixkit-merged.pdf"');
res.send(Buffer.from(merged));
} catch (e: any) {
res.status(500).send(e?.message || 'merge failed');
}
}