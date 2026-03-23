// api/quiz.js — Vercel Serverless Function (CommonJS)
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON" }); }
  }
  if (!body || !body.system || !body.messages) {
    return res.status(400).json({ error: "Missing system or messages", received: JSON.stringify(body).slice(0, 100) });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: body.max_tokens || 1024,
        system: body.system,
        messages: body.messages,
      }),
    });
    const data = await response.json();
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
