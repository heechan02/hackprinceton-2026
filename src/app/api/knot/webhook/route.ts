import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { adminClient } from "@/services/supabase/admin";
import { knotFetch } from "@/services/knot/client";
import { classifyTransaction } from "@/services/gemini/billProtector";
import { enqueueMessage } from "@/services/outbox";
import { env } from "@/lib/env";
import type { Transaction, SpendingRule } from "@/types/domain";

function verifySignature(rawBody: string, header: string | null): boolean {
  if (!header) return false;
  // Expected format: "hmac-sha256=<hex>"
  const expected = createHmac("sha256", env.KNOT_SECRET)
    .update(rawBody)
    .digest("hex");
  return header === `hmac-sha256=${expected}`;
}

async function processTransaction(
  txnData: Record<string, unknown>,
  patient: { id: string },
  rules: SpendingRule
) {
  const price = txnData.price as Record<string, unknown> | undefined;
  const merchant = txnData.merchant as Record<string, unknown> | undefined;
  const rawAmount = price?.total ?? price?.sub_total ?? txnData.total ?? txnData.amount ?? 0;
  const txn: Transaction = {
    id: String(txnData.id ?? txnData.order_id ?? ""),
    amount: Number(typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount),
    merchant_name: String(merchant?.name ?? txnData.merchant_name ?? txnData.merchant ?? ""),
    merchant_category: String(txnData.category ?? txnData.merchant_category ?? ""),
    daily_total: Number(typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount),
    description: txnData.description ? String(txnData.description) : undefined,
  };

  // Deduplicate — skip if we already stored this knot transaction
  if (txn.id) {
    const { data: existing } = await adminClient
      .from("transactions")
      .select("id")
      .eq("knot_id", txn.id)
      .limit(1);
    if (existing?.length) return;
  }

  const classification = classifyTransaction(txn, rules);

  await adminClient.from("transactions").insert({
    patient_id: patient.id,
    knot_id: txn.id,
    total: txn.amount,
    merchant: txn.merchant_name,
    skus: (txnData.skus as unknown[]) ?? [],
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
    const body =
      `⚠️ Flagged transaction: ${txn.merchant_name} — $${txn.amount.toFixed(2)}\n` +
      `Reason: ${classification.reason}\n` +
      `Reply "approve ${event.id}" or "block ${event.id}" to proceed.`;
    await enqueueMessage({ phone: env.CARETAKER_PHONE, body }).catch(console.error);
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sigHeader =
    req.headers.get("knot-signature") ?? req.headers.get("x-knot-signature");

  if (!verifySignature(rawBody, sigHeader)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const eventType = String(payload.type ?? payload.event ?? "");

    // Load patient + rules once
    const { data: patients } = await adminClient.from("patients").select("*").limit(1);
    if (!patients?.length) return NextResponse.json({ ok: true });
    const patient = patients[0]!;

    const { data: rulesRows } = await adminClient
      .from("spending_rules")
      .select("*")
      .eq("patient_id", patient.id)
      .limit(1);
    if (!rulesRows?.length) return NextResponse.json({ ok: true });
    const rulesRow = rulesRows[0]!;
    const rules: SpendingRule = {
      max_single_txn: rulesRow.max_single_txn,
      daily_limit: rulesRow.daily_limit,
      blocked_categories: rulesRow.blocked_categories,
    };

    if (eventType === "NEW_TRANSACTIONS_AVAILABLE" || eventType === "UPDATED_TRANSACTIONS_AVAILABLE") {
      const userId = String(payload.user_id ?? payload.external_user_id ?? "");
      const merchantId = payload.merchant_id ?? (payload.merchant as Record<string, unknown>)?.id;

      const syncData = (await knotFetch("/transactions/sync", {
        method: "POST",
        body: JSON.stringify({
          external_user_id: userId || "nannycam-patient-1",
          merchant_id: merchantId,
        }),
      })) as { transactions?: Record<string, unknown>[] };

      const transactions = syncData.transactions ?? [];
      for (const txnData of transactions) {
        await processTransaction(txnData, patient, rules);
      }
    } else {
      // Fallback: treat the payload itself as a transaction (older webhook format)
      const txnData = (payload.transaction ?? payload.data ?? payload) as Record<string, unknown>;
      if (txnData.amount ?? txnData.total) {
        await processTransaction(txnData, patient, rules);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[knot/webhook] Error:", message);
    return NextResponse.json({ ok: true }); // 200 so Knot doesn't retry
  }
}
