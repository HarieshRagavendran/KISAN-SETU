// Vercel serverless function — proxies requests to the Gemini API (free tier)
// so the API key never reaches the browser. Deployed automatically at /api/summarize.
//
// Model name changes fairly often on Google's free tier. If this starts
// returning 404s, check https://ai.google.dev/gemini-api/docs/models for
// the current free-tier model id and update GEMINI_MODEL below.
const GEMINI_MODEL = 'gemini-2.5-flash';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  const { system, query } = req.body || {};
  if (!system || !query) {
    res.status(400).json({ error: 'Missing system or query' });
    return;
  }

  if (typeof query !== 'string' || query.length > 500) {
    res.status(400).json({ error: 'Query too long' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing GEMINI_API_KEY' });
    return;
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: query }] }],
          generationConfig: { maxOutputTokens: 400 },
        }),
      }
    );

    const data = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data?.error?.message || 'Upstream error' });
      return;
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reach Gemini API' });
  }
};
