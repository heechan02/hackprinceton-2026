import { NextResponse } from "next/server";
import { knotFetch } from "@/services/knot/client";
import { adminClient } from "@/services/supabase/admin";
import { classifyTransaction } from "@/services/gemini/billProtector";
import { enqueueMessage } from "@/services/outbox";
import { env } from "@/lib/env";
import type { Transaction, SpendingRule } from "@/types/domain";

// TODO: Knot sandbox only — merchant ID 19 = DoorDash test account.
// Transactions returned are fake/sandbox data, not real purchases.
const MERCHANT_IDS = [19];

export async function POST() {
  const { data: patients } = await adminClient.from("patients").select("*").limit(1);
  if (!patients?.length) return NextResponse.json({ ok: false, error: "No patient" }, { status: 400 });
  const patient = patients[0]!;

  const { data: rulesRows } = await adminClient
    .from("spending_rules").select("*").eq("patient_id", patient.id).limit(1);
  if (!rulesRows?.length) return NextResponse.json({ ok: false, error: "No rules" }, { status: 400 });
  const rulesRow = rulesRows[0]!;
  const rules: SpendingRule = {
    max_single_txn: rulesRow.max_single_txn,
    daily_limit: rulesRow.daily_limit,
    blocked_categories: rulesRow.blocked_categories,
  };

  let total = 0;
  let flagged = 0;

  for (const merchantId of MERCHANT_IDS) {
    const data = (await knotFetch("/transactions/sync", {
      method: "POST",
      body: JSON.stringify({ external_user_id: "nannycam-patient-1", merchant_id: merchantId }),
    })) as { transactions?: Record<string, unknown>[] };

    console.log("[knot/sync] FULL RAW RESPONSE:", JSON.stringify(data).slice(0, 2000));
    for (const txnData of data.transactions ?? []) {
      const price = txnData.price as Record<string, unknown> | undefined;
      const merchant = txnData.merchant as Record<string, unknown> | undefined;
      const rawAmount = price?.total ?? price?.sub_total ?? txnData.total ?? txnData.amount ?? 0;
      const txn: Transaction = {
        id: String(txnData.id ?? txnData.order_id ?? ""),
        amount: Number(typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount),
        merchant_name: String(merchant?.name ?? txnData.merchant_name ?? txnData.merchant ?? "DoorDash"),
        merchant_category: String(txnData.category ?? txnData.merchant_category ?? "Food Delivery"),
        daily_total: Number(typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount),
      };

      const classification = classifyTransaction(txn, rules);
      const eventKind = classification.flagged ? "txn_flagged" : "txn_ok";

      await adminClient.from("transactions").upsert({
        patient_id: patient.id,
        knot_id: txn.id,
        total: txn.amount,
        merchant: txn.merchant_name,
        skus: (txnData.skus as unknown[]) ?? [],
        flagged: classification.flagged,
        reason: classification.flagged ? classification.reason : null,
      }, { onConflict: "knot_id" });

      const { data: event } = await adminClient.from("events").insert({
        patient_id: patient.id,
        kind: eventKind as "txn_flagged" | "txn_ok",
        status: classification.flagged ? "pending" : "completed",
        payload: { txn, classification } as Record<string, unknown>,
      }).select("id").single();

      if (classification.flagged && event) {
        await enqueueMessage({
          phone: env.CARETAKER_PHONE,
          body:
            `⚠️ Flagged transaction: ${txn.merchant_name} — $${txn.amount.toFixed(2)}\n` +
            `Reason: ${classification.reason}\n` +
            `Reply "approve ${event.id}" or "block ${event.id}" to proceed.`,
        }).catch(console.error);
        flagged++;
      }
      total++;
    }
  }

  // Re-classify existing transactions against current rules
  const { data: existingTxns } = await adminClient
    .from("transactions")
    .select("*")
    .eq("patient_id", patient.id);

  console.log("[knot/sync] existing txns:", existingTxns?.length, "rules:", JSON.stringify(rules));
  let reclassified = 0;
  for (const row of existingTxns ?? []) {
    console.log("[knot/sync] txn:", row.knot_id, "amount:", row.total, "flagged:", row.flagged);
    const txn: Transaction = {
      id: row.knot_id,
      amount: Number(row.total),
      merchant_name: row.merchant ?? "Unknown",
      merchant_category: "Food Delivery",
      daily_total: Number(row.total),
    };
    const classification = classifyTransaction(txn, rules);
    const wasFlagged = row.flagged ?? false;
    if (classification.flagged !== wasFlagged) {
      await adminClient.from("transactions").update({
        flagged: classification.flagged,
        reason: classification.flagged ? classification.reason : null,
      }).eq("id", row.id);

      if (classification.flagged) {
        const { data: event } = await adminClient.from("events").insert({
          patient_id: patient.id,
          kind: "txn_flagged" as const,
          status: "pending",
          payload: { txn, classification } as Record<string, unknown>,
        }).select("id").single();

        if (event) {
          await enqueueMessage({
            phone: env.CARETAKER_PHONE,
            body:
              `⚠️ Flagged transaction: ${txn.merchant_name} — $${txn.amount.toFixed(2)}\n` +
              `Reason: ${classification.reason}\n` +
              `Reply "approve ${event.id}" or "block ${event.id}" to proceed.`,
          }).catch(console.error);
          flagged++;
        }
      }
      reclassified++;
    }
  }

  return NextResponse.json({ ok: true, total, flagged, reclassified });
}
