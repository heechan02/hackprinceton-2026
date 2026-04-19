import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { GEMINI_API_KEY: "test-key" },
}));

const mockAnalyzeImage = vi.fn();
vi.mock("../client", () => ({
  analyzeImage: mockAnalyzeImage,
  GeminiParseError: class GeminiParseError extends Error {},
}));

describe("inventoryAssessment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns array of inventory results", async () => {
    const expected = [
      { item: "milk", stockLevel: "low" as const, confidence: "high" as const },
      { item: "bread", stockLevel: "ok" as const, confidence: "med" as const },
    ];
    mockAnalyzeImage.mockResolvedValueOnce(expected);

    const { inventoryAssessment } = await import("../pantry");
    const result = await inventoryAssessment("base64img", [
      { name: "milk", unit: "gallon" },
      { name: "bread" },
    ]);

    expect(result).toEqual(expected);
    expect(mockAnalyzeImage).toHaveBeenCalledOnce();
  });

  it("includes item names in the prompt", async () => {
    mockAnalyzeImage.mockResolvedValueOnce([]);

    const { inventoryAssessment } = await import("../pantry");
    await inventoryAssessment("base64img", [
      { name: "eggs", unit: "dozen" },
      { name: "orange juice" },
    ]);

    const prompt = (mockAnalyzeImage.mock.calls[0]?.[0] as { prompt: string }).prompt;
    expect(prompt).toContain("eggs");
    expect(prompt).toContain("dozen");
    expect(prompt).toContain("orange juice");
  });

  it("passes imageBase64 to analyzeImage", async () => {
    mockAnalyzeImage.mockResolvedValueOnce([]);

    const { inventoryAssessment } = await import("../pantry");
    await inventoryAssessment("mybase64data", [{ name: "milk" }]);

    expect((mockAnalyzeImage.mock.calls[0]?.[0] as { imageBase64: string }).imageBase64).toBe("mybase64data");
  });
});
