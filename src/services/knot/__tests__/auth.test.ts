import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    KNOT_CLIENT_ID: "test_client_id",
    KNOT_SECRET: "test_secret",
    KNOT_BASE_URL: "https://development.knotapi.com",
  },
}));

import { knotAuthHeader } from "../auth";

describe("knotAuthHeader", () => {
  it("returns correct Basic auth string", () => {
    const expected = `Basic ${Buffer.from("test_client_id:test_secret").toString("base64")}`;
    expect(knotAuthHeader()).toBe(expected);
  });

  it("starts with 'Basic '", () => {
    expect(knotAuthHeader()).toMatch(/^Basic /);
  });
});
