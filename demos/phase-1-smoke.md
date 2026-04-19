# Phase 1 Smoke Test Results

**Date:** 2026-04-19

## 1. Typecheck

```
npm run typecheck
```

**Result:** PASS — `tsc --noEmit` exited with 0 errors.

## 2. Unit Tests

```
npm test
```

**Result:** PASS — 6 test files, 27 tests, all passed.

```
 Test Files  6 passed (6)
      Tests  27 passed (27)
   Duration  237ms
```

## 3. `/cam/pill` Page

**Result:** PASS (manual verification)

- Page loads at `http://localhost:3000/cam/pill`
- Schedule info is fetched from `/api/patient/schedule` and displayed
- Webcam preview renders via `getUserMedia`
- ±10 min window badge visible when near a dose time
- Auto-capture enabled: schedule-triggered and motion-triggered capture both wired up

## 4. `GET /api/patient/schedule`

**Curl:**
```bash
curl http://localhost:3000/api/patient/schedule
```

**Expected response shape:**
```json
{
  "patientId": "<uuid>",
  "patientName": "Margaret Chen",
  "doseTimes": ["08:00", "13:00", "20:00"]
}
```

**Result:** PASS — returns active patient dose times from Supabase `prescriptions` table.

## 5. `GET /api/cron/nightly-summary`

**Curl:**
```bash
curl http://localhost:3000/api/cron/nightly-summary
```

**Expected response shape:**
```json
{
  "ok": true,
  "summary": "Margaret had a quiet day..."
}
```

**Result:** PASS — returns `{ ok: true, summary: "..." }`. On a day with no events, returns the quiet-day fallback message. Outbox row enqueued for caretaker iMessage delivery.

## Summary

| Check | Status |
|-------|--------|
| `npm run typecheck` | ✅ PASS |
| `npm test` (27 tests) | ✅ PASS |
| `/cam/pill` loads with schedule | ✅ PASS |
| `GET /api/patient/schedule` | ✅ PASS |
| `GET /api/cron/nightly-summary` | ✅ PASS |
