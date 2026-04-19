import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const VALID_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  GEMINI_API_KEY: "gemini-key",
  KNOT_CLIENT_ID: "knot-client",
  KNOT_SECRET: "knot-secret",
  KNOT_BASE_URL: "https://development.knotapi.com",
  PHOTON_PROJECT_ID: "photon-id",
  PHOTON_PROJECT_SECRET: "photon-secret",
  CARETAKER_PHONE: "+11234567890",
};

describe("env", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("happy path: exports env with all required keys", async () => {
    Object.assign(process.env, VALID_ENV);
    const { env } = await import("../env");
    expect(env.GEMINI_API_KEY).toBe("gemini-key");
    expect(env.KNOT_BASE_URL).toBe("https://development.knotapi.com");
    expect(env.CARETAKER_PHONE).toBe("+11234567890");
  });

  it("missing required key throws with key name in message", async () => {
    Object.assign(process.env, VALID_ENV);
    delete process.env.GEMINI_API_KEY;
    await expect(import("../env")).rejects.toThrow(/GEMINI_API_KEY/);
  });

  it("missing multiple keys lists all of them", async () => {
    Object.assign(process.env, VALID_ENV);
    delete process.env.GEMINI_API_KEY;
    delete process.env.KNOT_SECRET;
    await expect(import("../env")).rejects.toThrow(/GEMINI_API_KEY/);
  });

  it("clientEnv only contains NEXT_PUBLIC_ keys", async () => {
    Object.assign(process.env, VALID_ENV);
    const { clientEnv } = await import("../env");
    expect(Object.keys(clientEnv)).toEqual(
      expect.arrayContaining(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])
    );
    expect("GEMINI_API_KEY" in clientEnv).toBe(false);
  });
});
