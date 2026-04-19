import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock inventoryAssessment
vi.mock("@/services/gemini/pantry", () => ({
  inventoryAssessment: vi.fn(),
}));

// Mock env before imports that use it
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
    CARETAKER_PHONE: "+15550000000",
    GEMINI_API_KEY: "test",
    KNOT_CLIENT_ID: "test",
    KNOT_SECRET: "test",
    KNOT_BASE_URL: "https://development.knotapi.com",
    PHOTON_PROJECT_ID: "test",
    PHOTON_PROJECT_SECRET: "test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test",
  },
}));

// Mock Supabase admin
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/services/supabase/admin", () => ({
  adminClient: {
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert,
    })),
  },
}));

import { route } from "./commandRouter";

describe("commandRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("status intent returns last 5 events", async () => {
    mockSelect.mockReturnValue({
      order: () => ({
        limit: () =>
          Promise.resolve({
            data: [
              {
                kind: "med_check",
                status: "completed",
                payload: {},
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          }),
      }),
    });

    const reply = await route({ from: "+1555", text: "status" });
    expect(reply).toContain("Last 5 events");
    expect(reply).toContain("med_check");
  });

  it("how is mom triggers status", async () => {
    mockSelect.mockReturnValue({
      order: () => ({
        limit: () =>
          Promise.resolve({
            data: [],
            error: null,
          }),
      }),
    });

    const reply = await route({ from: "+1555", text: "how is mom doing?" });
    expect(reply).toContain("No events");
  });

  it("rules intent returns spending rules", async () => {
    mockSelect.mockReturnValue(
      Promise.resolve({
        data: [
          {
            max_single_txn: "100.00",
            daily_limit: "300.00",
            blocked_categories: ["gambling"],
          },
        ],
        error: null,
      })
    );

    const reply = await route({ from: "+1555", text: "rules" });
    expect(reply).toContain("Spending rules");
    expect(reply).toContain("100");
    expect(reply).toContain("gambling");
  });

  it("reorder intent queues an event", async () => {
    // patients query
    const fromMock = vi.fn();
    const { adminClient } = await import("@/services/supabase/admin");
    (adminClient.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "patients") {
          return {
            select: () => ({
              limit: () =>
                Promise.resolve({ data: [{ id: "patient-1" }], error: null }),
            }),
          };
        }
        if (table === "events") {
          return {
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      }
    );

    const reply = await route({ from: "+1555", text: "reorder milk" });
    expect(reply).toContain("milk");
    expect(reply).toContain("queued");
  });

  it("approve intent updates event status and replies ✓ Approved.", async () => {
    const { adminClient } = await import("@/services/supabase/admin");
    (adminClient.from as ReturnType<typeof vi.fn>).mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () =>
            Promise.resolve({ data: [{ id: "abc123" }], error: null }),
        }),
      }),
    });

    const reply = await route({ from: "+1555", text: "approve abc123" });
    expect(reply).toBe("✓ Approved.");
  });

  it("block intent updates event status and replies ✗ Blocked.", async () => {
    const { adminClient } = await import("@/services/supabase/admin");
    (adminClient.from as ReturnType<typeof vi.fn>).mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () =>
            Promise.resolve({ data: [{ id: "xyz789" }], error: null }),
        }),
      }),
    });

    const reply = await route({ from: "+1555", text: "block xyz789" });
    expect(reply).toBe("✗ Blocked.");
  });

  it("bare reorder runs inventoryAssessment and reports low items", async () => {
    const { adminClient } = await import("@/services/supabase/admin");
    const { inventoryAssessment } = await import("@/services/gemini/pantry");

    // Mock global fetch for snapshot download
    const fakeImageBuf = Buffer.from("fake-image");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      statusText: "OK",
      arrayBuffer: async () => fakeImageBuf.buffer,
    } as unknown as Response);

    (adminClient.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "events") {
          return {
            select: () => ({
              eq: () => ({
                not: () => ({
                  order: () => ({
                    limit: () =>
                      Promise.resolve({
                        data: [{ snapshot_url: "https://example.com/snap.jpg", patient_id: "p1" }],
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "inventory_items") {
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: [{ name: "milk" }, { name: "eggs" }],
                  error: null,
                }),
            }),
          };
        }
        return {};
      }
    );

    (inventoryAssessment as ReturnType<typeof vi.fn>).mockResolvedValue([
      { item: "milk", stockLevel: "low", confidence: "high" },
      { item: "eggs", stockLevel: "ok", confidence: "high" },
    ]);

    const reply = await route({ from: "+1555", text: "reorder" });
    expect(reply).toContain("milk");
    expect(reply).toContain("low");
    expect(reply).not.toContain("eggs");
  });

  it("bare reorder reports all stocked when nothing is low", async () => {
    const { adminClient } = await import("@/services/supabase/admin");
    const { inventoryAssessment } = await import("@/services/gemini/pantry");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      statusText: "OK",
      arrayBuffer: async () => Buffer.from("fake").buffer,
    } as unknown as Response);

    (adminClient.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "events") {
          return {
            select: () => ({
              eq: () => ({
                not: () => ({
                  order: () => ({
                    limit: () =>
                      Promise.resolve({
                        data: [{ snapshot_url: "https://example.com/snap.jpg", patient_id: "p1" }],
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "inventory_items") {
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: [{ name: "milk" }],
                  error: null,
                }),
            }),
          };
        }
        return {};
      }
    );

    (inventoryAssessment as ReturnType<typeof vi.fn>).mockResolvedValue([
      { item: "milk", stockLevel: "ok", confidence: "high" },
    ]);

    const reply = await route({ from: "+1555", text: "reorder" });
    expect(reply).toContain("well-stocked");
  });

  it("unknown intent returns help text", async () => {
    const reply = await route({ from: "+1555", text: "hello there" });
    expect(reply).toContain("Try:");
  });
});
