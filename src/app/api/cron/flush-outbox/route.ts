import { NextResponse } from "next/server";
import { adminClient } from "@/services/supabase/admin";
import { createSpectrumApp } from "@/services/photon/app";
import { sendToPhone, sendTextWithImage } from "@/services/photon/outbound";
import { text } from "spectrum-ts";

export async function POST() {
  // Fetch up to 20 pending messages
  const { data: rows, error } = await adminClient
    .from("outbox")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const app = await createSpectrumApp();
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    // Mark as sending
    await adminClient
      .from("outbox")
      .update({ status: "sending" })
      .eq("id", row.id);

    let result: { ok: boolean; error?: string };

    if (row.attachment_path) {
      result = await sendTextWithImage(app, row.recipient_phone, row.body, row.attachment_path);
    } else {
      result = await sendToPhone(app, row.recipient_phone, text(row.body));
    }

    if (result.ok) {
      await adminClient
        .from("outbox")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } else {
      await adminClient
        .from("outbox")
        .update({ status: "failed", error: result.error ?? "unknown" })
        .eq("id", row.id);
      failed++;
      console.error(`[outbox] Failed to send ${row.id}: ${result.error}`);
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
