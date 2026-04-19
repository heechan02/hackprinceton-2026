# Step 5: Smoke E2E

## Task

Verify phase 2 end-to-end:

1. Run `npm run typecheck` — must pass
2. Run `npm test` — all tests must pass
3. Send a test webhook to `/api/knot/webhook` with a valid HMAC and a transaction that exceeds `max_single_txn` — confirm flagged outbox message is enqueued
4. Document results in `demos/phase-2-smoke.md`

## AC

- Typecheck passes
- All tests pass
- `demos/phase-2-smoke.md` exists with results
