import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { adminClient } from "@/services/supabase/admin";
import { classifyTransaction } from "@/services/gemini/billProtector";
import { enqueueMessage } from "@/services/outbox";
import { env } from "@/lib/env";
import type { Transaction, SpendingRule } from "@/types/domain";

function verifySignature(rawBody: string, signature: string): boolean {
  const expected = createHmac("sha256", env.KNOT_SECRET)
    .update(rawBody)
    .digest("hex");
  const expectedHeader = `hmac-sha256=${expected}`;
  if (signature.length !== expectedHeader.length) return false;
  // Constant-time comparison
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedHeader.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-knot-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;

    // Load active patient
    const { data: patients, error: pErr } = await adminClient
      .from("patients")
      .select("*")
      .limit(1);
    if (pErr || !patients?.length) {
      console.error("[webhook] No patient found:", pErr?.message);
      return NextResponse.json({ ok: true });
    }
    const patient = patients[0]!;

    // Load spending rules
    const { data: rulesRows, error: rErr } = await adminClient
      .from("spending_rules")
      .select("*")
      .eq("patient_id", patient.id)
      .limit(1);
    if (rErr || !rulesRows?.length) {
      console.error("[webhook] No spending rules found:", rErr?.message);
      return NextResponse.json({ ok: true });
    }
    const rulesRow = rulesRows[0]!;
    const rules: SpendingRule = {
      max_single_txn: rulesRow.max_single_txn,
      daily_limit: rulesRow.daily_limit,
      blocked_categories: rulesRow.blocked_categories,
    };

    // Parse transaction from webhook payload
    const txnData = (payload.transaction ?? payload) as Record<string, unknown>;
    const txn: Transaction = {
      id: String(txnData.id ?? ""),
      amount: Number(txnData.amount ?? txnData.total ?? 0),
      merchant_name: String(txnData.merchant_name ?? txnData.merchant ?? ""),
      merchant_category: String(txnData.merchant_category ?? txnData.category ?? ""),
      daily_total: Number(txnData.daily_total ?? txnData.amount ?? txnData.total ?? 0),
      description: txnData.description ? String(txnData.description) : undefined,
    };

    // Classify transaction
    let classification;
    try {
      classification = classifyTransaction(txn, rules);
    } catch (classErr) {
      console.error("[webhook] Classification error:", classErr);
      return NextResponse.json({ ok: true });
    }

    // Insert transactions row
    const { error: txnErr } = await adminClient.from("transactions").insert({
      patient_id: patient.id,
      knot_id: txn.id,
      total: txn.amount,
      merchant: txn.merchant_name,
      skus: (txnData.skus as unknown[]) ?? [],
      flagged: classification.flagged,
      reason: classification.flagged ? classification.reason : null,
    });
    if (txnErr) {
      console.error("[webhook] Failed to insert transaction:", txnErr.message);
    }

    // Insert events row
    const eventKind = classification.flagged ? "txn_flagged" : "txn_ok";
    const { data: event, error: evErr } = await adminClient
      .from("events")
      .insert({
        patient_id: patient.id,
        kind: eventKind as "txn_flagged" | "txn_ok",
        status: classification.flagged ? "pending" : "completed",
        payload: {
          txn,
          classification,
        } as Record<string, unknown>,
      })
      .select("id")
      .single();
    if (evErr) {
      console.error("[webhook] Failed to insert event:", evErr.message);
      return NextResponse.json({ ok: true });
    }

    // Enqueue message if flagged
    if (classification.flagged && event) {
      const body =
        `⚠️ Flagged transaction: ${txn.merchant_name} — $${txn.amount.toFixed(2)}\n` +
        `Reason: ${classification.reason}\n` +
        `Reply "approve ${event.id}" or "block ${event.id}" to proceed.`;
      try {
        await enqueueMessage({ phone: env.CARETAKER_PHONE, body });
      } catch (enqErr) {
        console.error("[webhook] Failed to enqueue message:", enqErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[webhook] Error:", message);
    // Return 200 so Knot doesn't retry on parse errors
    return NextResponse.json({ ok: true });
  }
}
