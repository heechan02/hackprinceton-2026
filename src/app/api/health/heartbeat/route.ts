import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/services/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { camKind } = await req.json() as { camKind: string };
    if (!camKind) {
      return NextResponse.json({ ok: false, error: "camKind required" }, { status: 400 });
    }

    const { error } = await adminClient
      .from("system_health")
      .upsert(
        { cam_kind: camKind, last_heartbeat_at: new Date().toISOString() },
        { onConflict: "cam_kind" }
      );

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[heartbeat] Error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
