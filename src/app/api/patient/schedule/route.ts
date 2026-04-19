import { NextResponse } from "next/server";
import { adminClient } from "@/services/supabase/admin";

export async function GET() {
  const { data: patient, error: patientError } = await adminClient
    .from("patients")
    .select("id")
    .limit(1)
    .single();

  if (patientError || !patient) {
    return NextResponse.json({ ok: false, error: "No active patient" }, { status: 404 });
  }

  const { data: prescriptions, error: rxError } = await adminClient
    .from("prescriptions")
    .select("dose_times")
    .eq("patient_id", patient.id);

  if (rxError) {
    return NextResponse.json({ ok: false, error: rxError.message }, { status: 500 });
  }

  const doseTimes = Array.from(
    new Set((prescriptions ?? []).flatMap((rx) => rx.dose_times))
  );

  return NextResponse.json({ ok: true, doseTimes });
}
