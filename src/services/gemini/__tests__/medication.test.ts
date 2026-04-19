import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { GEMINI_API_KEY: "test-key" },
}));

const mockAnalyzeImage = vi.fn();
vi.mock("../client", () => ({
  analyzeImage: mockAnalyzeImage,
  GeminiParseError: class GeminiParseError extends Error {},
}));

describe("verifyMedication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns medication result on valid response", async () => {
    const expected = {
      compartmentEmptied: true,
      pillCountRemoved: 2,
      confidence: "high" as const,
      notes: "Compartment clearly empty",
    };
    mockAnalyzeImage.mockResolvedValueOnce(expected);

    const { verifyMedication } = await import("../medication");
    const result = await verifyMedication("base64img", {
      medicationName: "Lisinopril",
      dosage: "10mg",
      pillsPerDose: 2,
    });

    expect(result).toEqual(expected);
    expect(mockAnalyzeImage).toHaveBeenCalledOnce();
    const call = mockAnalyzeImage.mock.calls[0]?.[0] as { imageBase64: string; prompt: string };
    expect(call.imageBase64).toBe("base64img");
    expect(call.prompt).toContain("Lisinopril");
  });

  it("passes prescription details into the prompt", async () => {
    mockAnalyzeImage.mockResolvedValueOnce({
      compartmentEmptied: false,
      pillCountRemoved: 0,
      confidence: "med",
      notes: "Pills still present",
    });

    const { verifyMedication } = await import("../medication");
    await verifyMedication("base64img", {
      medicationName: "Metformin",
      dosage: "500mg",
      scheduledTime: "8:00 AM",
      pillsPerDose: 1,
    });

    const prompt = (mockAnalyzeImage.mock.calls[0]?.[0] as { prompt: string }).prompt;
    expect(prompt).toContain("Metformin");
    expect(prompt).toContain("500mg");
    expect(prompt).toContain("8:00 AM");
  });
});
