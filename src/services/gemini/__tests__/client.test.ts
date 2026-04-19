import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock the env module to avoid requiring real env vars
vi.mock("@/lib/env", () => ({
  env: { GEMINI_API_KEY: "test-key" },
}));

const mockGenerateContent = vi.hoisted(() => vi.fn());
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
  },
}));

import { GeminiParseError } from "../client";

const TestSchema = z.object({
  value: z.string(),
  count: z.number(),
});

describe("analyzeImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed result on valid JSON response", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ value: "hello", count: 42 }),
    });

    const { analyzeImage } = await import("../client");
    const result = await analyzeImage({
      imageBase64: "base64data",
      prompt: "Analyze this",
      schema: TestSchema,
    });

    expect(result).toEqual({ value: "hello", count: 42 });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("retries once on schema-invalid response, succeeds on second attempt", async () => {
    // First call: invalid schema (missing required fields)
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ wrong_field: "oops" }),
    });
    // Second call: valid
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ value: "retry", count: 1 }),
    });

    const { analyzeImage } = await import("../client");
    const result = await analyzeImage({
      imageBase64: "base64data",
      prompt: "Analyze this",
      schema: TestSchema,
    });

    expect(result).toEqual({ value: "retry", count: 1 });
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it("throws GeminiParseError after two consecutive schema failures", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ bad: true }),
    });

    const { analyzeImage } = await import("../client");
    await expect(
      analyzeImage({
        imageBase64: "base64data",
        prompt: "Analyze this",
        schema: TestSchema,
      }),
    ).rejects.toBeInstanceOf(GeminiParseError);

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it("throws on non-JSON response", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "This is not JSON at all",
    });

    const { analyzeImage } = await import("../client");
    await expect(
      analyzeImage({
        imageBase64: "base64data",
        prompt: "Analyze this",
        schema: TestSchema,
      }),
    ).rejects.toBeInstanceOf(GeminiParseError);
  });

  it("throws on API failure", async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error("Network error"));

    const { analyzeImage } = await import("../client");
    await expect(
      analyzeImage({
        imageBase64: "base64data",
        prompt: "Analyze this",
        schema: TestSchema,
      }),
    ).rejects.toThrow("Gemini API error");
  });
});
