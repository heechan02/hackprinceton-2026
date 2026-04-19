import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/services/supabase/admin";
import { verifyMedication } from "@/services/gemini/medication";
import { inventoryAssessment } from "@/services/gemini/pantry";
import { enqueueMessage } from "@/services/outbox";
import { env } from "@/lib/env";

const BodySchema = z.object({
  imageBase64: z.string().min(1),
});

const VALID_KINDS = ["pill", "pantry"] as const;
type CamKind = (typeof VALID_KINDS)[number];

function toImageBuffer(imageBase64: string): Buffer {
  const raw = imageBase64.startsWith("data:")
    ? imageBase64.split(",")[1] ?? imageBase64
    : imageBase64;
  return Buffer.from(raw, "base64");
}

export async function POST(req: NextRequest) {
  try {
    const kind = req.nextUrl.searchParams.get("kind");
    if (!VALID_KINDS.includes(kind as CamKind)) {
      return NextResponse.json({ ok: false, error: "Invalid kind. Must be 'pill' or 'pantry'." }, { status: 400 });
    }

    const body = BodySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ ok: false, error: "imageBase64 is required." }, { status: 400 });
    }

    const { imageBase64 } = body.data;
    const timestamp = Date.now();

    // Load patient
    const { data: patients, error: pErr } = await adminClient
      .from("patients")
      .select("*")
      .limit(1);
    if (pErr || !patients?.length) {
      throw new Error("No patient found: " + (pErr?.message ?? "empty result"));
    }
    const patient = patients[0]!;

    if (kind === "pill") {
      // Load prescriptions
      const { data: prescriptions, error: rxErr } = await adminClient
        .from("prescriptions")
        .select("*")
        .eq("patient_id", patient.id);
      if (rxErr || !prescriptions?.length) {
        throw new Error("No prescriptions found: " + (rxErr?.message ?? "empty result"));
      }

      // Find prescription with a dose_time within ±60 minutes of now
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      let prescription = prescriptions[0]!;
      outer: for (const rx of prescriptions) {
        for (const t of rx.dose_times ?? []) {
          const parts = (t as string).split(":");
          const h = parseInt(parts[0] ?? "0", 10);
          const m = parseInt(parts[1] ?? "0", 10);
          const rxMinutes = h * 60 + m;
          if (Math.abs(rxMinutes - nowMinutes) <= 60) {
            prescription = rx;
            break outer;
          }
        }
      }

      const geminiResult = await verifyMedication(imageBase64, {
        medicationName: prescription.name,
        dosage: `${prescription.compartments_per_dose} compartment(s)`,
        scheduledTime: prescription.dose_times?.[0],
        pillsPerDose: prescription.compartments_per_dose,
      });

      // Upload snapshot
      const snapshotPath = `events/${timestamp}-pill.jpg`;
      const { error: uploadErr } = await adminClient.storage
        .from("snapshots")
        .upload(snapshotPath, toImageBuffer(imageBase64), { contentType: "image/jpeg", upsert: true });

      let snapshotUrl: string | null = null;
      if (uploadErr) {
        console.warn("[capture] Snapshot upload failed:", uploadErr.message);
      } else {
        const { data: urlData } = adminClient.storage
          .from("snapshots")
          .getPublicUrl(snapshotPath);
        snapshotUrl = urlData.publicUrl;
      }

      // Insert event
      const { data: event, error: evErr } = await adminClient
        .from("events")
        .insert({
          patient_id: patient.id,
          kind: "med_check",
          status: "completed",
          payload: geminiResult as unknown as Record<string, unknown>,
          snapshot_url: snapshotUrl,
        })
        .select("id")
        .single();
      if (evErr) throw new Error("Failed to insert event: " + evErr.message);

      const takenStr = geminiResult.compartmentEmptied ? "taken ✓" : "not taken ✗";
      const summary = `${prescription.name}: compartment ${takenStr} (confidence: ${geminiResult.confidence}). ${geminiResult.notes}`;

      await enqueueMessage({
        phone: env.CARETAKER_PHONE,
        body: summary,
        attachmentPath: snapshotUrl ?? undefined,
      });

      return NextResponse.json({ ok: true, eventId: event.id, summary });
    }

    // kind === "pantry"
    const { data: inventoryItems, error: invErr } = await adminClient
      .from("inventory_items")
      .select("*")
      .eq("patient_id", patient.id);
    if (invErr) throw new Error("Failed to load inventory: " + invErr.message);

    const items = (inventoryItems ?? []).map((i) => ({ name: i.name }));
    const geminiResult = await inventoryAssessment(imageBase64, items);

    const snapshotPath = `events/${timestamp}-pantry.jpg`;
    const { error: uploadErr } = await adminClient.storage
      .from("snapshots")
      .upload(snapshotPath, toImageBuffer(imageBase64), { contentType: "image/jpeg", upsert: true });

    let snapshotUrl: string | null = null;
    if (uploadErr) {
      console.warn("[capture] Snapshot upload failed:", uploadErr.message);
    } else {
      const { data: urlData } = adminClient.storage
        .from("snapshots")
        .getPublicUrl(snapshotPath);
      snapshotUrl = urlData.publicUrl;
    }

    const { data: event, error: evErr } = await adminClient
      .from("events")
      .insert({
        patient_id: patient.id,
        kind: "pantry_check",
        status: "completed",
        payload: geminiResult as unknown as Record<string, unknown>,
        snapshot_url: snapshotUrl,
      })
      .select("id")
      .single();
    if (evErr) throw new Error("Failed to insert event: " + evErr.message);

    const lowItems = geminiResult
      .filter((r) => r.stockLevel === "empty" || r.stockLevel === "low")
      .map((r) => r.item);
    const summary =
      lowItems.length > 0
        ? `Pantry check: low/empty — ${lowItems.join(", ")}`
        : "Pantry check: all items stocked ✓";

    await enqueueMessage({
      phone: env.CARETAKER_PHONE,
      body: summary,
      attachmentPath: snapshotUrl ?? undefined,
    });

    return NextResponse.json({ ok: true, eventId: event.id, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[capture] Error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
