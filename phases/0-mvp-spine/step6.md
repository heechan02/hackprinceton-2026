# Step 6: End-to-end smoke test — webcam → Gemini → Supabase → outbox → iMessage

## Context

This step wires together every component built in steps 0–5 into one observable flow:

1. A laptop browser tab opens `/cam/pill`, grants webcam access, and captures a frame on button click.
2. The frame is POSTed to `/api/vision/capture?kind=pill` as base64.
3. The route loads the active patient's prescription, calls `verifyMedication` (Gemini), inserts an `events` row, uploads the snapshot to Supabase Storage, and enqueues an outbound iMessage via the outbox helper.
4. The agent worker (running in a separate terminal via `npm run agent`) drains the outbox and delivers the iMessage to the caretaker's phone.

This is the full spine. After this step the project proves it can see the world, reason about it, persist the reasoning, and notify a human — all glued together.

## Task

### Supabase Storage bucket

Add a SQL migration `supabase/migrations/0003_storage.sql` that creates a public `snapshots` bucket (if not already present). Use:

```sql
insert into storage.buckets (id, name, public)
values ('snapshots', 'snapshots', true)
on conflict (id) do nothing;
```

Document in the step output that the user must apply this migration manually in the Supabase dashboard SQL editor.

### Webcam capture component

Create `src/components/cam/WebcamCapture.tsx` as a Client Component:

- Request camera via `navigator.mediaDevices.getUserMedia({ video: true, audio: false })`
- Render a `<video>` element showing the live preview
- Render a "Capture & analyze" button that grabs the current frame into a canvas, reads it as base64 JPEG, and POSTs to `/api/vision/capture?kind=${kind}` (kind is a prop)
- Show the response status inline ("Analyzing…", "✓ Checked", "✗ Error: <message>")
- Also expose an `auto` prop: when true, capture every 60s. Default false.

### Camera page

Create `src/app/cam/[kind]/page.tsx`:

- Server component that reads `params.kind` and validates it's `"pill"` or `"pantry"`; 404 otherwise
- Renders `<WebcamCapture kind={params.kind} auto={false} />` inside a simple centered layout
- No auth; utility-only MVP

### Capture API route

Create `src/app/api/vision/capture/route.ts` as a POST handler:

1. Parse the JSON body; validate with Zod: `{ imageBase64: string (data URL or raw base64) }`
2. Read `?kind=pill|pantry` from URL — reject other values with 400
3. For `kind=pill`:
   - Load the single patient from Supabase (seed ensures one exists), along with the first prescription whose `dose_times[]` contains a time within ±60 minutes of now. If no prescription matches, use the first prescription and log a warning.
   - Call `verifyMedication(imageBase64, prescription)` from `src/services/gemini/medication.ts`
   - Upload the snapshot to Supabase Storage `snapshots` bucket at `events/<timestamp>-pill.jpg`, get the public URL
   - Insert an `events` row: `{ patient_id, kind: 'med_check', status: 'completed', payload: <Gemini result>, snapshot_url: <public URL>, created_at: now() }`
   - Build a human-readable summary (e.g., `"Morning dose for Lisinopril: compartment emptied ✓ (confidence: high)"`)
   - Call `enqueueMessage({ phone: env.CARETAKER_PHONE, body: summary, attachmentPath: <public URL> })` from `src/services/outbox.ts`
4. For `kind=pantry`: same shape but using `inventoryAssessment` and `kind: 'pantry_check'` — minimal implementation; may be expanded in later phases
5. Return `{ ok: true, eventId, summary }` on success, or `{ ok: false, error }` with 500 on failure
6. Wrap the entire handler in try/catch — no unhandled rejections

### enqueueMessage enhancement

If `src/services/outbox.ts` from step 4 doesn't yet support `attachmentPath` properly, update it to pass the attachment URL through to the outbox row. The agent worker's drainer should attach the file when sending.

### README update

Append a "Running the smoke test" section to the repo `README.md`:

```markdown
## Running the smoke test (Phase 0)

You need three things running simultaneously:

1. `npm run dev` — Next.js dev server (terminal 1)
2. `npm run agent` — Spectrum worker (terminal 2, must stay running)
3. Browser tab open at http://localhost:3000/cam/pill

Point your laptop webcam at anything (for demo purposes, any object works — the full vision pipeline runs end-to-end). Click "Capture & analyze". Within ~15 seconds you should see:

- A new row in the `events` table in Supabase
- An iMessage on your registered caretaker phone with a snapshot attached

If the iMessage doesn't arrive:

- Check the `outbox` table: is the row status `sent`, `pending`, or `failed`?
- If `failed`, the `error` column tells you what went wrong
- If `pending` forever, the agent worker isn't running — start `npm run agent`
```

### Demo capture

Record a screen capture (≥20 seconds) showing:

- The `/cam/pill` page with webcam active
- Clicking "Capture & analyze"
- The Supabase dashboard showing the new `events` row
- The caretaker phone screen showing the iMessage arrive with snapshot

Save as `demos/phase-0-smoke.mp4` and commit. If recording from within the harness isn't possible, the step may instead leave a placeholder file `demos/phase-0-smoke.TODO` with instructions for the user to record it manually, and mention this limitation in the step summary.

## AC

- Visiting `/cam/pill` shows a live webcam feed after granting browser permission
- Clicking "Capture & analyze" produces: (a) an `events` row in Supabase with `kind='med_check'` and a populated `payload`, (b) a `snapshot_url` pointing to a real publicly accessible image, (c) an `outbox` row transitioning from `pending` → `sent`, (d) an iMessage delivered to the caretaker phone within 15 seconds end-to-end
- `/cam/pantry` similarly works and produces a `pantry_check` event
- The full loop never crashes the dev server; all errors are caught, logged, and surfaced in the API response
- Payloads in `events` pass Zod validation (no raw unparsed Gemini strings stored)
- The README "Running the smoke test" section exists and matches the actual flow
- Either `demos/phase-0-smoke.mp4` exists, OR `demos/phase-0-smoke.TODO` exists with clear instructions

## Out of scope for this step

- Dashboard UI (that's phase 3)
- Real-time event subscriptions (phase 3)
- Scheduling (motion/time triggers) — capture is button-driven only for MVP
- Knot / Bill Protector — those are phases 2 and beyond
- Multi-patient support — assume exactly one seeded patient

## Notes on demo reliability

- Even if Gemini returns low-confidence or nonsense results (because the webcam is pointed at your desk, not a real pill organizer), the loop must still complete successfully and write a valid event. The quality of the vision result is not part of this step's AC — the plumbing is.
- If Gemini API calls fail repeatedly, wire up a mock mode: when `GEMINI_API_KEY` starts with `"mock_"`, return a hardcoded valid result instead of calling the API. This keeps the demo runnable offline.
