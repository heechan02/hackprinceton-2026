import { NextResponse } from "next/server";
import { knotFetch } from "@/services/knot/client";
import { env } from "@/lib/env";

export async function POST() {
  try {
    const data = (await knotFetch("/session/create", {
      method: "POST",
      body: JSON.stringify({
        external_user_id: "nannycam-patient-1", // TODO: hardcoded sandbox user
        type: "transaction_link",
      }),
    })) as { session?: string };

    const sessionId = data.session ?? "";
    return NextResponse.json({ ok: true, sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[knot/session] Error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
