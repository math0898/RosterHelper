import express from 'express';

const app  = express();
const PORT = process.env.PORT ?? 3001;

const WOWAUDIT_BASE = 'https://wowaudit.com';

app.use(express.json());

/**
 * POST /v1/wishlists
 * Body: { "api_key": "<key>" }
 *
 * Forwards the request to the wowaudit API on behalf of the browser
 * (bypasses CORS) and returns the raw JSON text.
 * Accepting the key in the POST body avoids exposing it in URL logs.
 */
app.post('/v1/wishlists', async (req, res) => {
  const api_key = req.body?.api_key;
  if (!api_key) {
    return res.status(400).send('Missing required body field: api_key');
  }

  const upstream = `${WOWAUDIT_BASE}/v1/wishlists?api_key=${encodeURIComponent(api_key)}`;

  try {
    const upstreamRes = await fetch(upstream, {
      headers: { Accept: 'application/json' },
    });
    const text = await upstreamRes.text();
    res
      .status(upstreamRes.status)
      .type('application/json')
      .send(text);
  } catch (err) {
    res.status(502).send(`Upstream request failed: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`RosterHelper proxy server listening on http://localhost:${PORT}`);
});
