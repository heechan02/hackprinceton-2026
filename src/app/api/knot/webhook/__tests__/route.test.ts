import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockEnqueue = vi.fn().mockResolvedValue("outbox-id");
vi.mock("@/services/outbox", () => ({ enqueueMessage: mockEnqueue }));

// Mock env – must match the schema keys
vi.mock("@/lib/env", () => ({
  env: {
    KNOT_SECRET: "test-secret",
    CARETAKER_PHONE: "+15550000001",
  },
}));

// Minimal Supabase admin mock
const mockPatient = { id: "patient-1", name: "Grandma" };
const mockRules = {
  patient_id: "patient-1",
  max_single_txn: 100,
  daily_limit: 300,
  blocked_categories: ["gambling"],
};
const mockEvent = { id: "event-abc" };

const mockSingle = vi.fn();
const mockInsertChain = { select: vi.fn(() => ({ single: mockSingle })) };
const mockInsert = vi.fn(() => mockInsertChain);

const fromImpl = (table: string) => {
  if (table === "patients") {
    return {
      select: vi.fn(() => ({
        limit: vi.fn(() => ({ data: [mockPatient], error: null })),
      })),
    };
  }
  if (table === "spending_rules") {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [mockRules], error: null })),
        })),
      })),
    };
  }
  if (table === "transactions") {
    return {
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null })),
        })),
      })),
    };
  }
  if (table === "events") {
    return { insert: mockInsert };
  }
  return {};
};

vi.mock("@/services/supabase/admin", () => ({
  adminClient: { from: vi.fn((t: string) => fromImpl(t)) },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSignature(body: string, secret = "test-secret"): string {
  const hash = createHmac("sha256", secret).update(body).digest("hex");
  return `hmac-sha256=${hash}`;
}

function makeRequest(body: object, signature: string) {
  const raw = JSON.stringify(body);
  return new Request("http://localhost/api/knot/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-knot-signature": signature,
    },
    body: raw,
  });
}

const normalTxn = {
  transaction: {
    id: "knot-txn-1",
    amount: 25,
    merchant_name: "Walmart",
    merchant_category: "Grocery",
    daily_total: 50,
  },
};

const flaggedTxn = {
  transaction: {
    id: "knot-txn-2",
    amount: 10,
    merchant_name: "Casino",
    merchant_category: "gambling",
    daily_total: 10,
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/knot/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: mockEvent, error: null });
  });

  it("returns 401 for invalid HMAC signature", async () => {
    const { POST } = await import("../route");
    const req = makeRequest(normalTxn, "hmac-sha256=badsignature00000000000");
    const res = await POST(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("returns 401 for missing signature", async () => {
    const { POST } = await import("../route");
    const raw = JSON.stringify(normalTxn);
    const req = new Request("http://localhost/api/knot/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw,
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 200 and enqueues message for flagged transaction", async () => {
    const { POST } = await import("../route");
    const body = JSON.stringify(flaggedTxn);
    const sig = makeSignature(body);
    const req = new Request("http://localhost/api/knot/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "x-knot-signature": sig },
      body,
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockEnqueue).toHaveBeenCalledOnce();
    const call = mockEnqueue.mock.calls[0]![0];
    expect(call.phone).toBe("+15550000001");
    expect(call.body).toMatch(/approve/i);
    expect(call.body).toMatch(/block/i);
  });

  it("returns 200 and does NOT enqueue for ok transaction", async () => {
    const { POST } = await import("../route");
    const body = JSON.stringify(normalTxn);
    const sig = makeSignature(body);
    const req = new Request("http://localhost/api/knot/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "x-knot-signature": sig },
      body,
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });
});
