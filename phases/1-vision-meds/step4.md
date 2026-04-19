# Step 4: Smoke E2E

## Task

Verify phase 1 end-to-end:

1. Run `npm run typecheck` — must pass
2. Run `npm test` — all tests must pass
3. Manually confirm `/cam/pill` loads with schedule info visible
4. Confirm `GET /api/patient/schedule` returns dose times
5. Confirm `GET /api/cron/nightly-summary` returns a summary (call it via curl or browser)

Document results in `demos/phase-1-smoke.md`.

## AC

- Typecheck passes
- All tests pass
- `demos/phase-1-smoke.md` exists with results
