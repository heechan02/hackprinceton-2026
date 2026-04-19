# Step 3: Health check cron + webcam heartbeat

## Task

1. Add heartbeat writes to `WebcamCapture.tsx`: every 60s when camera is active, call `POST /api/health/heartbeat` with `{ camKind }`. Implement that route to upsert a row in `system_health`.

2. Implement `GET /api/cron/health-check/route.ts`:
   - Reads `system_health` rows
   - If any cam has `last_heartbeat_at` older than 15 minutes, enqueue an outbox message: "⚠ {camKind} cam offline — please check the device"
   - Returns `{ ok: true, alerts: string[] }`

3. Add a **System Status** card to the dashboard showing each cam's last heartbeat time and online/offline status pill.

## AC

- Heartbeat route upserts correctly
- Health check returns alerts for stale cams
- Dashboard shows system status card
- Typecheck passes
