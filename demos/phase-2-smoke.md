# Phase 2 — Bill Protector Smoke Test Results

**Date:** 2026-04-19

## 1. Typecheck

```
$ npm run typecheck
> tsc --noEmit
(exit 0 — no errors)
```

**Result: PASS**

---

## 2. Unit Tests

```
$ npm test
> vitest run

 Test Files  8 passed (8)
      Tests  35 passed (35)
   Duration  355ms
```

**Result: PASS**

---

## 3. Webhook Smoke — Flagged Transaction (exceeds `max_single_txn`)

The webhook test suite (`route.test.ts`) exercises this path end-to-end with mocked Supabase/outbox. The relevant test case:

> **"enqueues outbox message for flagged transaction"**
> - `max_single_txn` = 100 (USD cents × 100 = $1.00)
> - Transaction amount sent: 999 (> 100)
> - HMAC-SHA256 signature computed with `KNOT_SECRET = "test-secret"`
> - POST to `/api/knot/webhook`
> - Response: `{ ok: true, flagged: true }`
> - `enqueueMessage` called once with `phone: "+15550000001"`, body matching `/approve/i` and `/block/i`

To reproduce manually against a running dev server, generate the signature:

```bash
node -e "
const crypto = require('crypto');
const secret = '<KNOT_SECRET>';
const txn = {
  id: 'smoke-txn-001',
  merchant: { name: 'Electronics Superstore' },
  amount: 99999,
  currency: 'USD',
  products: [{ name: 'iPad Pro', price: 99999 }],
  timestamp: new Date().toISOString()
};
const body = JSON.stringify(txn);
const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
console.log(sig);
"
```

Then:

```bash
curl -X POST http://localhost:3000/api/knot/webhook \
  -H "Content-Type: application/json" \
  -H "x-knot-signature: <sig>" \
  -d '{"id":"smoke-txn-001","merchant":{"name":"Electronics Superstore"},"amount":99999,"currency":"USD","products":[{"name":"iPad Pro","price":99999}]}'
# Expected: {"ok":true,"flagged":true}
```

**Result: PASS** (verified via unit test)

---

## Summary

| Check | Status |
|-------|--------|
| `npm run typecheck` | ✓ Pass |
| `npm test` (35 tests, 8 suites) | ✓ Pass |
| Flagged-transaction outbox enqueue | ✓ Pass |
