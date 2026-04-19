# Step 4: Smoke E2E — full demo run

## Task

Final end-to-end verification of the complete NannyCam system:

1. `npm run typecheck` — must pass
2. `npm test` — all tests must pass
3. `npm run build` — must produce a clean production build
4. Manual demo checklist:
   - [ ] `/onboarding` — complete setup flow
   - [ ] `/cam/pantry` — capture pantry, see result + iMessage delivered to caretaker
   - [ ] `/cam/pill` — capture pill organizer, see result + iMessage delivered
   - [ ] `/dashboard` — events feed shows today's checks, realtime update works
   - [ ] iMessage "status" command — agent replies with today's summary
   - [ ] iMessage "rules" command — agent replies with spending rules
   - [ ] `GET /api/cron/nightly-summary` — returns paragraph summary
5. Document results in `demos/phase-3-smoke.md`

## AC

- Typecheck passes
- All tests pass
- Build succeeds
- `demos/phase-3-smoke.md` exists with demo checklist results
