# Architecture Decision Records

## Philosophy

MVP speed first. Demo stability over theoretical correctness. Choose the minimum working implementation that survives 2 minutes of live judging. Every external dependency must have a mock fallback.

---

### ADR-001: Next.js App Router on single Vercel/Node deployment

**Decision**: Single Next.js app hosts dashboard, API routes, cron, and webhook handlers. No separate backend.
**Reason**: One deploy target, one env, one codebase. Hackathon speed.
**Trade-offs**: Long-running agent loops (webcam polling) need a companion Node process or client-side loop; we use client-side loops driven from /cam pages.

### ADR-002: Photon spectrum-ts in REMOTE mode

**Decision**: Use Photon's hosted iMessage infrastructure (IMESSAGE_SERVER_URL + IMESSAGE_API_KEY from Pro dashboard), not local `imessage-kit` mode.
**Reason**: Remote mode runs on Linux, removes the macOS EC2 / MacBook demo-sleep risk. Pro plan includes it.
**Trade-offs**: Dependent on Photon uptime during demo. Mitigation: have a pre-recorded demo video as backup.

### ADR-003: Laptop webcam, not Raspberry Pi

**Decision**: Use `getUserMedia` on a `/cam/[kind]` web page on a laptop placed near the pill organizer and pantry.
**Reason**: 24h timeline. Pi networking on venue Wi-Fi kills 2–3 hours minimum.
**Trade-offs**: Demo uses laptop cameras; pitch says "designed to run on a Pi in production."

### ADR-004: Gemini structured output via Zod

**Decision**: Every vision/LLM call asks for JSON matching a declared Zod schema; response is parsed through the schema before use.
**Reason**: LLMs hallucinate free text. A schema failure is better than acting on bad data.
**Trade-offs**: One extra parse step per call.

### ADR-005: Knot development environment only

**Decision**: Use `https://development.knotapi.com` with sandbox credentials.
**Reason**: Production requires real card enrollment + KYC. Impossible in 24h.
**Trade-offs**: Transactions are synthetic; pitch will be honest about this.

### ADR-006: Motion-triggered + schedule-triggered capture, not continuous polling

**Decision**: Medication cam triggers ±10 min around scheduled dose times. Pantry cam triggers on frame-diff motion detection.
**Reason**: 10-second polling burns ~$34/day in Gemini calls and hallucinates on identical frames. Triggers cut >95% of calls.
**Trade-offs**: Slightly more complex trigger logic.

### ADR-007: Soft auth via iMessage phone number

**Decision**: Commands are only executed if sender phone matches the registered caretaker number. No password, no OAuth.
**Reason**: Hackathon scope. iMessage is already strongly tied to a device.
**Trade-offs**: Not production-safe. Pitch says "biometric confirmation in production."

### ADR-008: Reorder anomaly guard

**Decision**: Auto-execute Knot checkouts under a threshold (2× rolling average); above that, send approval request to caretaker first.
**Reason**: Defends against Gemini miscounts giving the system a runaway credit card.
**Trade-offs**: Slight friction for genuinely large restock moments.
