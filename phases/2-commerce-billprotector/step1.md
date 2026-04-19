# Step 1: Knot webhook handler

## Task

Implement `POST /api/knot/webhook/route.ts`.

This route:
1. Verifies HMAC-SHA256 signature: `X-Knot-Signature` header = `hmac-sha256(KNOT_SECRET, rawBody)`
2. Parses the transaction from the webhook payload
3. Loads the active patient's `spending_rules`
4. Calls `classifyTransaction(txn, rules)` from `services/gemini/billProtector.ts`
5. Inserts a `transactions` row and an `events` row (`kind=txn_flagged` if flagged, else `kind=txn_ok`)
6. If flagged: `enqueueMessage` asking caretaker to "approve <eventId>" or "block <eventId>"
7. Returns `{ ok: true }`

Return 200 even on classification errors (log and continue) — Knot retries on non-2xx.

## AC

- Invalid HMAC returns 401
- Valid webhook with flagged transaction enqueues an outbox message
- Valid webhook with ok transaction does not enqueue
- Typecheck passes
