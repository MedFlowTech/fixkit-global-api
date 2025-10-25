import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "Missing Replicate API token." });
  }

  try {
    // Read uploaded image
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) chunks.push(chunk as Uint8Array);
    const buffer = Buffer.concat(chunks);
    const base64 = buffer.toString("base64");

    // Call Recraft AI background-removal model (highest quality)
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "aa1e55aa41d8427e31ecbeea998f986e88e91b2d4b4a3136c81e32c5e8a0a234", // Recraft background-removal
        input: {
          image: `data:image/png;base64,${base64}`
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error || "Replicate request failed" });
    }

    // Poll until processing completes
    let outputUrl: string | null = null;
    while (!outputUrl) {
      const check = await fetch(data.urls.get, {
        headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
      });
      const result = await check.json();
      if (result.status === "succeeded" && result.output && result.output[0]) {
        outputUrl = result.output[0];
        break;
      }
      if (result.status === "failed") throw new Error("AI processing failed");
      await new Promise(r => setTimeout(r, 2000));
    }

    res.status(200).json({ ok: true, url: outputUrl });
  } catch (err: any) {
    console.error("Cloud background removal error:", err);
    res.status(500).json({ error: err.message || "Background removal failed" });
  }
}
