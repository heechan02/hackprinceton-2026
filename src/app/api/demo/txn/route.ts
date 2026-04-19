/**
 * Demo-only endpoint: inject a transaction without Knot signature verification.
 * Use this for live demos and testing Bill Protector locally.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/services/supabase/admin";
import { classifyTransaction } from "@/services/gemini/billProtector";
import { enqueueMessage } from "@/services/outbox";
import { env } from "@/lib/env";
import type { Transaction, SpendingRule } from "@/types/domain";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    merchant?: string;
    amount?: number;
    category?: string;
    description?: string;
  };

  const { data: patients } = await adminClient.from("patients").select("*").limit(1);
  if (!patients?.length) {
    return NextResponse.json({ ok: false, error: "No patient configured" }, { status: 400 });
  }
  const patient = patients[0]!;

  const { data: rulesRows } = await adminClient
    .from("spending_rules")
    .select("*")
    .eq("patient_id", patient.id)
    .limit(1);
  if (!rulesRows?.length) {
    return NextResponse.json({ ok: false, error: "No spending rules configured" }, { status: 400 });
  }
  const rulesRow = rulesRows[0]!;
  const rules: SpendingRule = {
    max_single_txn: rulesRow.max_single_txn,
    daily_limit: rulesRow.daily_limit,
    blocked_categories: rulesRow.blocked_categories,
  };

  const txn: Transaction = {
    id: `demo-${Date.now()}`,
    amount: body.amount ?? 0,
    merchant_name: body.merchant ?? "Unknown",
    merchant_category: body.category ?? "General",
    daily_total: body.amount ?? 0,
    description: body.description,
  };

  const classification = classifyTransaction(txn, rules);

  await adminClient.from("transactions").insert({
    patient_id: patient.id,
    knot_id: txn.id,
    total: txn.amount,
    merchant: txn.merchant_name,
    skus: [],
    flagged: classification.flagged,
    reason: classification.flagged ? classification.reason : null,
  });

  const eventKind = classification.flagged ? "txn_flagged" : "txn_ok";
  const { data: event } = await adminClient
    .from("events")
    .insert({
      patient_id: patient.id,
      kind: eventKind as "txn_flagged" | "txn_ok",
      status: classification.flagged ? "pending" : "completed",
      payload: { txn, classification } as Record<string, unknown>,
    })
    .select("id")
    .single();

  if (classification.flagged && event) {
    const msg =
      `⚠️ Flagged transaction: ${txn.merchant_name} — $${txn.amount.toFixed(2)}\n` +
      `Reason: ${classification.reason}\n` +
      `Reply "approve ${event.id}" or "block ${event.id}" to proceed.`;
    await enqueueMessage({ phone: env.CARETAKER_PHONE, body: msg }).catch(console.error);
  }

  return NextResponse.json({ ok: true, classification, eventKind });
}
