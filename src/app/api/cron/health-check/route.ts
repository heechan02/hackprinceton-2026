import { NextResponse } from "next/server";
import { adminClient } from "@/services/supabase/admin";
import { enqueueMessage } from "@/services/outbox";
import { env } from "@/lib/env";

const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  try {
    const { data: rows, error } = await adminClient
      .from("system_health")
      .select("cam_kind, last_heartbeat_at");

    if (error) throw new Error(error.message);

    const alerts: string[] = [];
    const now = Date.now();

    for (const row of rows ?? []) {
      const lastBeat = new Date(row.last_heartbeat_at).getTime();
      if (now - lastBeat > STALE_THRESHOLD_MS) {
        const msg = `⚠ ${row.cam_kind} cam offline — please check the device`;
        alerts.push(msg);
        await enqueueMessage({ phone: env.CARETAKER_PHONE, body: msg });
      }
    }

    return NextResponse.json({ ok: true, alerts });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[health-check] Error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
