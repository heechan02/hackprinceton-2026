/**
 * One-shot demo seed: wipes existing demo data, then inserts a realistic
 * day's worth of events so the dashboard looks alive for screen recording.
 *
 * GET /api/demo/seed
 */
import { NextResponse } from "next/server";
import { adminClient } from "@/services/supabase/admin";

export async function GET() {
  // 1. Find patient (must already be onboarded)
  const { data: patients } = await adminClient
    .from("patients")
    .select("*")
    .order("poa_confirmed_at", { ascending: false })
    .limit(1);

  if (!patients?.length) {
    return NextResponse.json(
      { ok: false, error: "No patient — run onboarding first" },
      { status: 400 },
    );
  }
  const patient = patients[0]!;

  // 2. Wipe today's events and transactions for a clean slate
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  await adminClient
    .from("events")
    .delete()
    .eq("patient_id", patient.id)
    .gte("created_at", todayStart.toISOString());

  await adminClient
    .from("transactions")
    .delete()
    .eq("patient_id", patient.id);

  // 3. Seed events with realistic timestamps (staggered over today)
  const baseTime = new Date();
  baseTime.setHours(7, 58, 0, 0);

  function timeOffset(minutes: number): string {
    return new Date(baseTime.getTime() + minutes * 60_000).toISOString();
  }

  const events = [
    {
      patient_id: patient.id,
      kind: "med_check" as const,
      status: "completed" as const,
      payload: {
        summary: "Wednesday AM compartment emptied — Aricept 10mg taken on schedule.",
        compartment: "Wednesday AM",
        result: "taken",
      },
      created_at: timeOffset(0), // 7:58 AM
    },
    {
      patient_id: patient.id,
      kind: "pantry_check" as const,
      status: "completed" as const,
      payload: {
        summary: "Pantry scan: rice is low (1 bag remaining), cereal is empty, bread is OK.",
        items: [
          { name: "Rice", level: "low", qty: 1 },
          { name: "Cereal", level: "empty", qty: 0 },
          { name: "Bread", level: "ok", qty: 2 },
        ],
      },
      created_at: timeOffset(80), // ~9:18 AM
    },
    {
      patient_id: patient.id,
      kind: "reorder" as const,
      status: "completed" as const,
      payload: {
        summary: "Auto-reorder placed at Walmart: Great Value Rice (5lb), Cheerios Oat Crunch — $18.50",
        merchant: "Walmart",
        items: ["Great Value Rice 5lb", "Cheerios Oat Crunch"],
        total: 18.5,
      },
      created_at: timeOffset(81), // ~9:19 AM
    },
    {
      patient_id: patient.id,
      kind: "txn_flagged" as const,
      status: "pending" as const,
      payload: {
        summary: "$450.00 charge at Best Buy — exceeds $100 single transaction limit",
        txn: { merchant_name: "Best Buy", amount: 450.0, category: "Electronics" },
        classification: {
          flagged: true,
          reason: "Amount $450.00 exceeds max single transaction limit of $100.00",
        },
      },
      created_at: timeOffset(210), // ~11:28 AM
    },
    {
      patient_id: patient.id,
      kind: "med_check" as const,
      status: "completed" as const,
      payload: {
        summary: "Wednesday PM compartment emptied — Aricept 10mg taken.",
        compartment: "Wednesday PM",
        result: "taken",
      },
      created_at: timeOffset(600), // ~5:58 PM
    },
  ];

  const { error: evtError } = await adminClient.from("events").insert(events);
  if (evtError) {
    return NextResponse.json({ ok: false, error: evtError.message }, { status: 500 });
  }

  // 4. Seed matching transactions
  const transactions = [
    {
      patient_id: patient.id,
      knot_id: `demo-cvs-${Date.now()}`,
      total: 12.4,
      merchant: "CVS Pharmacy",
      skus: [],
      flagged: false,
      reason: null,
    },
    {
      patient_id: patient.id,
      knot_id: `demo-bestbuy-${Date.now()}`,
      total: 450.0,
      merchant: "Best Buy",
      skus: [],
      flagged: true,
      reason: "Amount $450.00 exceeds max single transaction limit of $100.00",
    },
  ];

  await adminClient.from("transactions").insert(transactions);

  // 5. Seed system health (both cams online)
  const now = new Date().toISOString();
  for (const cam of ["pill", "pantry"]) {
    await adminClient
      .from("system_health")
      .upsert(
        { cam_kind: cam, last_heartbeat_at: now },
        { onConflict: "cam_kind" },
      );
  }

  return NextResponse.json({
    ok: true,
    patient: patient.name,
    seeded: {
      events: events.length,
      transactions: transactions.length,
      camsOnline: 2,
    },
  });
}
