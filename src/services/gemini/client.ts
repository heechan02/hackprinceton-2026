import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "@/lib/env";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const MODEL_PRIMARY = "gemini-2.5-flash-lite";

export class GeminiParseError extends Error {
  constructor(
    message: string,
    public readonly raw: string,
  ) {
    super(message);
    this.name = "GeminiParseError";
  }
}

export async function analyzeImage<T>({
  imageBase64,
  mimeType = "image/jpeg",
  prompt,
  schema,
}: {
  imageBase64: string;
  mimeType?: string;
  prompt: string;
  schema: z.ZodType<T>;
}): Promise<T> {
  const rawData = imageBase64.startsWith("data:")
    ? (imageBase64.split(",")[1] ?? imageBase64)
    : imageBase64;

  async function attempt(): Promise<string> {
    const response = await ai.models.generateContent({
      model: MODEL_PRIMARY,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: rawData,
              },
            },
            {
              text:
                prompt +
                "\n\nRespond with ONLY valid JSON matching the schema. No markdown, no explanation.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";
    return text;
  }

  function parseRaw(raw: string): T {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new GeminiParseError("Response is not valid JSON", raw);
    }
    const result = schema.safeParse(json);
    if (!result.success) {
      throw new GeminiParseError(
        `Schema validation failed: ${result.error.message}`,
        raw,
      );
    }
    return result.data;
  }

  let raw: string;
  try {
    raw = await attempt();
  } catch (err) {
    if (err instanceof GeminiParseError) throw err;
    throw new Error(`Gemini API error: ${String(err)}`);
  }

  try {
    return parseRaw(raw);
  } catch (firstErr) {
    if (!(firstErr instanceof GeminiParseError)) throw firstErr;
    // Retry once
    let raw2: string;
    try {
      raw2 = await attempt();
    } catch (err) {
      throw new Error(`Gemini API error on retry: ${String(err)}`);
    }
    return parseRaw(raw2);
  }
}
