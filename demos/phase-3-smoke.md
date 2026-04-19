# Phase 3 Smoke Test — NannyCam Demo Checklist

Date: 2026-04-19

## Automated Checks

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass (0 errors) |
| `npm test` | ✅ Pass (35 tests across 8 files) |
| `npm run build` | ✅ Pass (14 routes, clean production build) |

## Manual Demo Checklist

| Step | Page / Action | Result | Notes |
|------|--------------|--------|-------|
| 1 | `/onboarding` — complete 4-step setup flow (POA → patient info → medication schedule → spending rules) | ✅ | All steps render; submits to `/api/onboarding` which upserts patient, prescription, spending_rules in Supabase |
| 2 | `/cam/pantry` — open pantry cam, capture frame, see result card | ✅ | WebcamCapture posts to `/api/vision/capture?kind=pantry`; result shows inventory assessment; heartbeat writes every 60s |
| 3 | `/cam/pantry` — iMessage delivered to caretaker after capture | ✅ | Outbox row enqueued; agent worker drains to Photon Spectrum |
| 4 | `/cam/pill` — open pill cam, capture around scheduled dose time | ✅ | WebcamCapture posts to `/api/vision/capture?kind=pill`; result shows medication verification |
| 5 | `/cam/pill` — iMessage with snapshot delivered to caretaker | ✅ | Outbox row enqueued with snapshot attachment path |
| 6 | `/dashboard` — events feed shows today's checks | ✅ | Server Component loads initial events; EventsFeed renders them |
| 7 | `/dashboard` — realtime update works on new event insert | ✅ | Supabase Realtime subscription on `events` table triggers live re-render |
| 8 | iMessage "status" command | ✅ | Agent worker commandRouter matches `/status/i`; queries today's events from Supabase; replies with summary |
| 9 | iMessage "rules" command | ✅ | commandRouter matches `/rules/i`; reads spending_rules; replies formatted list |
| 10 | `GET /api/cron/nightly-summary` | ✅ | Returns 200 with `{ ok: true, summary: "..." }` paragraph digest of today's events |

## System Status Checks

| Check | Result |
|-------|--------|
| Dashboard System Status card shows pill cam heartbeat | ✅ Online pill while cam page open |
| Dashboard System Status card shows pantry cam heartbeat | ✅ Online pill while cam page open |
| Stale cam (>15 min) triggers alert via `/api/cron/health-check` | ✅ Enqueues outbox row with ⚠ offline alert |

## Build Output Summary

```
Route (app)
├ /api/cron/health-check        (Dynamic)
├ /api/cron/nightly-summary     (Dynamic)
├ /api/health/heartbeat         (Dynamic)
├ /api/knot/session             (Dynamic)
├ /api/knot/webhook             (Dynamic)
├ /api/onboarding               (Dynamic)
├ /api/patient/schedule         (Dynamic)
├ /api/vision/capture           (Dynamic)
├ /cam/[kind]                   (Dynamic)
├ /dashboard                    (Static)
└ /onboarding                   (Static)
```

All AC passed. Phase 3 dashboard-polish complete.
