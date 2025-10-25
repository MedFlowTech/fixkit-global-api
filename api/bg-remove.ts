import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const apiKey = process.env.REMOVEBG_API_KEY;
    if (!apiKey) throw new Error("Remove.bg API key missing.");

    const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });

    const formData = new FormData();
    formData.append("image_file", new Blob([fileBuffer]));
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formData as any,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Remove.bg failed: ${text}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const base64 = imageBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    res.status(200).json({ ok: true, url: dataUrl });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
