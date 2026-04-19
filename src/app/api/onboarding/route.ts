import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/services/supabase/admin";

const bodySchema = z.object({
  name: z.string().min(1),
  timezone: z.string().min(1),
  caretakerPhone: z.string().min(1),
  prescriptionName: z.string().min(1),
  doseTimes: z.array(z.string()).min(1),
  maxSingleTxn: z.number().positive(),
  dailyLimit: z.number().positive(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const {
    name,
    timezone,
    caretakerPhone,
    prescriptionName,
    doseTimes,
    maxSingleTxn,
    dailyLimit,
  } = parsed.data;

  // Find or create patient by caretaker_phone
  const { data: existing } = await adminClient
    .from("patients")
    .select("id")
    .eq("caretaker_phone", caretakerPhone)
    .limit(1)
    .single();

  let patientId: string;

  if (existing) {
    // Update existing patient
    const { error } = await adminClient
      .from("patients")
      .update({
        name,
        timezone,
        poa_confirmed_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    patientId = existing.id;
  } else {
    // Insert new patient
    const { data, error } = await adminClient
      .from("patients")
      .insert({
        name,
        timezone,
        caretaker_phone: caretakerPhone,
        poa_confirmed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create patient" },
        { status: 500 }
      );
    }
    patientId = data.id;
  }

  // Replace prescriptions: delete all for this patient, then insert
  await adminClient.from("prescriptions").delete().eq("patient_id", patientId);

  const { error: prescriptionError } = await adminClient
    .from("prescriptions")
    .insert({
      patient_id: patientId,
      name: prescriptionName,
      dose_times: doseTimes,
      compartments_per_dose: 1,
    });

  if (prescriptionError) {
    return NextResponse.json(
      { error: prescriptionError.message },
      { status: 500 }
    );
  }

  // Replace spending rules: delete all for this patient, then insert
  await adminClient.from("spending_rules").delete().eq("patient_id", patientId);

  const { error: rulesError } = await adminClient.from("spending_rules").insert({
    patient_id: patientId,
    max_single_txn: maxSingleTxn,
    daily_limit: dailyLimit,
    blocked_categories: [],
  });

  if (rulesError) {
    return NextResponse.json({ error: rulesError.message }, { status: 500 });
  }

  // Send welcome iMessage
  await adminClient.from("outbox").insert({
    recipient_phone: caretakerPhone,
    body: `👋 NannyCam is now set up for ${name}.\n\nYou'll receive alerts here for:\n• Missed medications\n• Flagged transactions\n• Low pantry items\n\nReply "approve <id>" or "block <id>" to act on flagged transactions.`,
  });

  return NextResponse.json({ ok: true, patientId });
}
