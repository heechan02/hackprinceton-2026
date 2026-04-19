# Architecture

NannyCam is a two-process Next.js + Node application backed by Supabase, with external calls to Gemini (vision), Photon Spectrum (iMessage agent), and Knot API (transactions + shopping). The two processes communicate exclusively through Supabase — there are no direct in-memory links between them.

## Two-Process Model

```
┌───────────────────────────────────────┐       ┌─────────────────────────────────┐
│ Next.js web app (port 3000)           │       │ Agent worker (node process)     │
│ ─────────────────────────────         │       │ ─────────────────────────────   │
│ • Caretaker dashboard (UI)            │       │ • Owns Spectrum app loop        │
│ • /cam/[kind] webcam pages            │       │ • Drains outbox → iMessage      │
│ • API routes:                         │       │ • Reads inbound iMessages       │
│   - /api/vision/capture               │       │ • Routes commands via           │
│   - /api/knot/webhook                 │       │   agent/commandRouter.ts        │
│   - /api/knot/session                 │       │ • Writes events rows in response│
│   - /api/cron/nightly-summary         │       │                                 │
│ • Calls Gemini + Knot synchronously   │       │ Started with: npm run agent     │
│ • Writes events + outbox rows         │       │                                 │
└───────────────┬───────────────────────┘       └─────────────────┬───────────────┘
                │                                                 │
                │         ┌───────────────────────────┐           │
                └────────▶│     Supabase (Postgres)   │◀──────────┘
                          │  tables: patients,        │
                          │    prescriptions,         │
                          │    inventory_items,       │
                          │    spending_rules,        │
                          │    events, transactions,  │
                          │    outbox, system_health  │
                          │  storage: snapshots       │
                          └───────────────────────────┘
```

**Why two processes?** The Spectrum SDK is a long-lived async iterator (`for await (const [space, message] of app.messages)`) and serverless Next.js route handlers cannot hold open connections for more than a few seconds. Splitting the worker out means:

- Next.js can redeploy / hot-reload without dropping the iMessage connection
- A crash in one process doesn't kill the other
- The boundary between "Next.js code that observes the world" and "agent code that acts on the world" is clean and async-durable

## Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── vision/capture/route.ts       # POST: image → Gemini → event + outbox
│   │   ├── knot/webhook/route.ts         # POST: TransactionLink webhook (phase 2)
│   │   ├── knot/session/route.ts         # POST: create Knot session (phase 2)
│   │   └── cron/nightly-summary/route.ts # GET:  9pm day digest (phase 2/3)
│   ├── cam/[kind]/page.tsx               # webcam capture page; kind = "pill" | "pantry"
│   ├── dashboard/page.tsx                # main caretaker dashboard (phase 3)
│   └── onboarding/page.tsx               # POA confirmation + config (phase 3)
│
├── components/
│   ├── cam/WebcamCapture.tsx             # client component: getUserMedia + POST
│   └── dashboard/*                       # phase 3
│
├── services/
│   ├── gemini/
│   │   ├── client.ts                     # generic analyzeImage<T>(prompt, schema) wrapper
│   │   ├── medication.ts                 # verifyMedication() → Zod result
│   │   ├── pantry.ts                     # inventoryAssessment() → Zod result
│   │   └── billProtector.ts              # classifyTransaction() → Zod result (phase 2)
│   ├── knot/
│   │   ├── auth.ts                       # Basic auth header from client_id:secret
│   │   ├── client.ts                     # fetch wrapper for development.knotapi.com
│   │   ├── transactions.ts               # sync + get by id (phase 2)
│   │   └── shopping.ts                   # sync-cart + checkout (phase 2)
│   ├── photon/
│   │   ├── app.ts                        # createSpectrumApp() — used by worker only
│   │   └── outbound.ts                   # sendToPhone(app, phone, ...content)
│   ├── supabase/
│   │   ├── admin.ts                      # service-role client (server only)
│   │   └── client.ts                     # anon client (browser)
│   └── outbox.ts                         # enqueueMessage({phone, body, attachmentPath?})
│
├── agent/
│   ├── worker.ts                         # entrypoint: Spectrum app + outbox drainer
│   └── commandRouter.ts                  # inbound intent matching (status/approve/block/reorder/rules)
│
├── types/
│   ├── db.ts                             # Supabase-generated types
│   └── domain.ts                         # Patient, Prescription, Event, Transaction, Rule
│
└── lib/
    ├── env.ts                            # Zod-validated env accessor (server-only + client-safe)
    └── zod.ts                            # shared schemas (EventKind, Severity, etc.)

supabase/
├── migrations/
│   ├── 0001_init.sql                     # tables + indices
│   ├── 0002_outbox.sql                   # outbox table for async iMessage sending
│   └── 0003_storage.sql                  # snapshots storage bucket
└── seed.sql                              # one patient + one prescription + inventory + rules

scripts/
├── execute.py                            # harness (unchanged)
├── test_execute.py                       # harness tests (unchanged)
└── smoke-photon.ts                       # step 3: hello-world iMessage
```

## Data Flow — Medication Verification

```
1. Caretaker opens /cam/pill on laptop near parent's pill organizer
2. WebcamCapture (client) calls getUserMedia, shows preview
3. Button click → canvas → base64 JPEG → POST /api/vision/capture?kind=pill
4. API route (Next.js):
   a. Loads active patient + relevant prescription from Supabase
   b. Calls services/gemini/medication.verifyMedication(imageBase64, prescription)
   c. Uploads snapshot to Supabase Storage (snapshots bucket) → public URL
   d. Inserts events row (kind=med_check, status=completed, payload, snapshot_url)
   e. Calls services/outbox.enqueueMessage({phone, body, attachmentPath})
   f. Returns { ok, eventId, summary }
5. Agent worker (separate process):
   a. Drainer loop sees new outbox row with status='pending'
   b. Claims it: UPDATE outbox SET status='sending' WHERE id=? AND status='pending'
   c. Uses Spectrum: imessage(app).user(phone) → .space(user) → .send(body, attachment)
   d. On success: UPDATE outbox SET status='sent', sent_at=now()
   e. On failure: UPDATE outbox SET status='failed', error=<msg>
6. Caretaker's iPhone receives the iMessage with snapshot
```

## Data Flow — Bill Protector (phase 2)

```
1. Knot TransactionLink fires webhook → POST /api/knot/webhook
2. API route:
   a. Verifies HMAC-SHA256 signature using KNOT_SECRET
   b. Parses transaction object (products, total, merchant)
   c. Loads spending_rules for the patient
   d. Calls services/gemini/billProtector.classifyTransaction(txn, rules)
   e. Inserts transactions row + events row (kind=txn_flagged if flagged)
   f. If flagged: enqueueMessage asking caretaker to approve or block
3. Caretaker replies "approve <id>" or "block <id>" via iMessage
4. Agent worker's commandRouter matches the regex:
   a. UPDATE events SET status='approved'|'blocked' WHERE id=<id>
   b. Replies confirmation via space.send
```

## Data Flow — Inbound Agent Commands

```
1. Caretaker sends iMessage (e.g. "status", "approve abc123", "rules")
2. Spectrum yields [space, message] in the worker's for-await loop
3. Worker filters: ignore anything where message.sender.id !== env.CARETAKER_PHONE
4. Worker filters: ignore message.content.type !== "text"
5. Inside space.responding(async () => { ... }) [auto typing indicator]:
   a. Call commandRouter.route({ from, text })
   b. Router matches regex → reads/writes Supabase → returns reply text
   c. space.send(reply)
```

## State Management

- **Source of truth:** Supabase Postgres, always. No in-memory caches that outlive a request.
- **Server state in Next.js:** Server Components read directly via `services/supabase/admin.ts`.
- **Client state:** local `useState` only (editor forms, modal toggles). No Redux, no Zustand, no global store.
- **Realtime:** dashboard subscribes to the `events` table via Supabase realtime (phase 3).
- **Worker state:** entirely held in Supabase. If the worker restarts, it picks up the outbox exactly where it left off because `status='sending'` rows are retried by the drainer's WHERE clause being `status='pending'` — and we adopt the convention that on boot, the worker runs a one-time `UPDATE outbox SET status='pending' WHERE status='sending'` to reclaim rows a prior crashed worker was processing.

## Race Condition Handling

All multi-writer tables use **conditional updates** rather than read-then-write:

```typescript
// WRONG: race on "who claims this row"
const row = await supabase
  .from("outbox")
  .select()
  .eq("status", "pending")
  .limit(1);
await supabase.from("outbox").update({ status: "sending" }).eq("id", row.id);

// RIGHT: atomic claim
const { data } = await supabase
  .from("outbox")
  .update({ status: "sending" })
  .eq("status", "pending")
  .select()
  .limit(5);
// Only rows that were still 'pending' at UPDATE time come back
```

Same pattern for `events.status` transitions (pending → in_progress → completed | approved | blocked | failed) and anywhere two processes can touch the same row.

## Offline / Failure Handling

- **Heartbeat:** Each webcam page (when auto-capture is enabled) writes to `system_health` every 60s with `cam_kind` and `last_heartbeat_at`.
- **Health-check cron:** `/api/cron/nightly-summary` and a separate `/api/cron/health-check` (phase 3) detect stale heartbeats (>15min) and enqueue an outbox alert ("⚠ Pill Cam offline — please check the device").
- **Gemini failures:** The `services/gemini/client.ts` wrapper retries once on schema mismatch, twice on network failure. Complete failure surfaces as `events.status='failed'` with the error in `payload`. The smoke path never crashes the user-facing route — errors are caught and logged.
- **Knot failures:** Same pattern. A failed reorder becomes `events` row with `status='failed'` and an iMessage to the caretaker: "Tried to reorder milk, but Walmart returned an error. Want me to retry?"
- **Photon worker crash:** The Next.js app keeps working — events and outbox rows continue to accumulate. When the worker is restarted, it picks up pending outbox rows and delivers them. No messages are lost (only delayed).
- **Wi-Fi outage at the parent's home:** Detected via stale heartbeats. Caretaker is alerted. No action can be taken until connectivity resumes.

## Secrets & Environment

All environment access goes through `src/lib/env.ts`, which:

- Parses `process.env` through a Zod schema at module load
- Throws a descriptive error listing missing keys if anything required is absent
- Exports two objects: `env` (server-only, includes secrets) and `clientEnv` (only `NEXT_PUBLIC_*` keys)

Direct access to `process.env.X` anywhere outside `src/lib/env.ts` is a lint-level violation.

## Testing Strategy (Hackathon-Scoped)

Tests exist only where they save debugging time:

- `src/lib/env.test.ts` — missing/malformed env vars
- `src/services/gemini/*.test.ts` — Zod schema validation on good/bad model output
- `src/services/knot/auth.test.ts` — Basic auth header generation
- `src/agent/commandRouter.test.ts` — intent matching correctness

All other code ships without tests. Integration is verified via live smoke tests (step 6 of each phase).

## Deployment Topology (for the hackathon demo)

- **Next.js app:** `npm run dev` on a demo laptop, exposed locally
- **Agent worker:** `npm run agent` in a second terminal on the same laptop
- **Supabase:** hosted project on supabase.com (free tier)
- **Photon Spectrum:** cloud mode (no self-hosting)
- **Knot:** development environment
- **Gemini:** Google AI Studio API key
- **Laptop webcams:** one for `/cam/pill`, optionally a second (or phone as webcam) for `/cam/pantry`

Production deployment (out of MVP scope): Next.js to Vercel, agent worker to a small VPS or Fly.io machine (long-lived process), Supabase and external APIs unchanged.
