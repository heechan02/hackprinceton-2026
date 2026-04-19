# Step 3: Nightly summary cron

## Task

Implement `GET /api/cron/nightly-summary/route.ts`.

This route:

1. Loads all `events` rows from today (midnight to now) for the active patient
2. Builds a plain-text summary prompt and calls Gemini (`gemini/client.ts`) to produce a one-paragraph natural-language day summary
3. Enqueues the summary via `services/outbox.enqueueMessage`
4. Returns `{ ok: true, summary: string }`

The route should be callable manually (for demo) and also work as a Vercel cron target.

## AC

- Route returns `{ ok: true, summary }` with a non-empty summary
- If no events today, summary says "Quiet day — no events recorded."
- Enqueues exactly one outbox message
- Typecheck passes
