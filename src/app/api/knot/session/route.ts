import { NextResponse } from "next/server";
import { knotFetch } from "@/services/knot/client";
import { env } from "@/lib/env";

export async function POST() {
  try {
    const data = (await knotFetch("/sessions", {
      method: "POST",
      body: JSON.stringify({ client_id: env.KNOT_CLIENT_ID }),
    })) as { session_token?: string; token?: string };

    const sessionToken = data.session_token ?? data.token ?? "";
    return NextResponse.json({ ok: true, sessionToken });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[knot/session] Error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
