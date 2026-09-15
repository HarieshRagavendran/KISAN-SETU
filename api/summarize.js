// Vercel serverless function — proxies requests to the Claude API so the
// API key never reaches the browser. Deployed automatically at /api/summarize.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  const { system, query } = req.body || {};
  if (!system || !query) {
    res.status(400).json({ error: 'Missing system or query' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' });
    return;
  }

  // Basic guardrails: cap input size so this endpoint can't be used to
  // proxy arbitrarily large/expensive requests.
  if (typeof query !== 'string' || query.length > 500) {
    res.status(400).json({ error: 'Query too long' });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system,
        messages: [{ role: 'user', content: query }],
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data?.error?.message || 'Upstream error' });
      return;
    }

    const text = (data.content || []).map((c) => c.text || '').join('');
    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reach Claude API' });
  }
}
