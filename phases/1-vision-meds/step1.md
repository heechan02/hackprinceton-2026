# Step 1: Schedule-triggered pill capture

## Task

Add schedule-aware auto-capture to `/cam/pill`. The webcam page should accept an `auto` prop. When `auto={true}`, check every 60 seconds whether the current time is within ±10 minutes of any `dose_times` entry for the active patient's prescriptions. If yes, trigger a capture. If not, skip.

Fetch dose times from a new API route `GET /api/patient/schedule` that returns the active patient's prescription dose times as an array of "HH:MM" strings.

## AC

- `GET /api/patient/schedule` returns `{ ok: true, doseTimes: string[] }`
- Auto-capture only fires within ±10 min of a scheduled dose time
- No duplicate captures within the same dose window (track last capture time in `useRef`)
- Typecheck passes
