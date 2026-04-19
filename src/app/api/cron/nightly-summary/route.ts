import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminClient } from "@/services/supabase/admin";
import { enqueueMessage } from "@/services/outbox";
import { env } from "@/lib/env";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function GET() {
  try {
    // Load active patient
    const { data: patients, error: pErr } = await adminClient
      .from("patients")
      .select("id, name")
      .limit(1);
    if (pErr || !patients?.length) {
      throw new Error("No patient found: " + (pErr?.message ?? "empty result"));
    }
    const patient = patients[0]!;

    // Today's date range (midnight to now)
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);

    const { data: events, error: evErr } = await adminClient
      .from("events")
      .select("kind, status, payload, created_at")
      .eq("patient_id", patient.id)
      .gte("created_at", midnight.toISOString())
      .lte("created_at", now.toISOString())
      .order("created_at", { ascending: true });

    if (evErr) throw new Error("Failed to load events: " + evErr.message);

    let summary: string;

    if (!events || events.length === 0) {
      summary = "Quiet day — no events recorded.";
    } else {
      const eventLines = events.map((e) => {
        const time = new Date(e.created_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `[${time}] ${e.kind} (${e.status}): ${JSON.stringify(e.payload)}`;
      });

      const prompt = `You are a caring assistant helping an adult child monitor their elderly parent.
Write a one-paragraph natural-language day summary based on these events for ${patient.name}.
Be warm, clear, and concise. Highlight any concerns.

Events:
${eventLines.join("\n")}

Write only the summary paragraph, no headings or extra text.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      summary = (response.text ?? "").trim();
      if (!summary) summary = "Quiet day — no events recorded.";
    }

    await enqueueMessage({
      phone: env.CARETAKER_PHONE,
      body: `📋 Daily summary for ${patient.name}:\n\n${summary}`,
    });

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[nightly-summary] Error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
