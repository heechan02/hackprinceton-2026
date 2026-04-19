/** One-shot endpoint to wipe all transactions and their events for a clean demo. */
import { NextResponse } from "next/server";
import { adminClient } from "@/services/supabase/admin";

export async function POST() {
  const { count: txnCount } = await adminClient
    .from("transactions")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const { count: evtCount } = await adminClient
    .from("events")
    .delete()
    .in("kind", ["txn_flagged", "txn_ok"]);

  return NextResponse.json({ ok: true, deletedTxns: txnCount ?? "all", deletedEvents: evtCount ?? "all" });
}
