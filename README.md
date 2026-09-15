# Kisan Setu

A grounded assistant for Indian government farm-scheme eligibility. Farmers enter
their state, category, land status, and crop, then ask a plain-language question.
The app matches their question against 377 authentic agriculture schemes (filtered
from the MyScheme dataset), shows deterministic eligibility flags (land ownership,
state match, exclusions) before any AI involvement, then calls Claude for a short
grounded summary that cites only the retrieved scheme data.

## Structure

```
index.html        Frontend — UI, scheme data, retrieval logic, deterministic flags
api/summarize.js   Vercel serverless function — proxies the Claude API call so the
                    API key stays server-side and never reaches the browser
package.json
```

## Deploy on Vercel

1. Push this repo to GitHub (see below).
2. Go to https://vercel.com/new and import the GitHub repo.
3. In the project's **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your Anthropic API key (get one at
     https://console.anthropic.com)
4. Deploy. Vercel will serve `index.html` as the static site and
   `api/summarize.js` as a serverless function at `/api/summarize` automatically
   — no build step or framework config needed.

## Local development

```bash
npm install -g vercel
vercel dev
```

This runs both the static file and the `/api/summarize` function locally,
reading `ANTHROPIC_API_KEY` from a `.env.local` file (not committed — see
`.gitignore`).

## Notes

- The scheme dataset has no deadline field, so the app never invents one —
  scheme cards link to the official source for current dates.
- The AI summary is instructed to only use the retrieved scheme records and to
  say plainly when a farmer's profile suggests they may not qualify.
- This is guidance only, not an application system — it never submits anything
  on the farmer's behalf.
