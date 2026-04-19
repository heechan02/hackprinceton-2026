# Step 2: Knot session route

## Task

Implement `POST /api/knot/session/route.ts`.

This route creates a Knot session for card enrollment:
1. Calls `knotFetch("/sessions", { method: "POST", body: { ... } })` with patient reference
2. Returns `{ ok: true, sessionToken: string }` for use by a frontend Knot SDK embed

Also add a minimal `src/app/onboarding/page.tsx` placeholder that shows a "Connect your card" button (non-functional for now — just renders the page without errors).

## AC

- Route returns `{ ok: true, sessionToken }` shape
- Onboarding page renders without errors at `/onboarding`
- Typecheck passes
