import { env } from "@/lib/env";
import { knotAuthHeader } from "./auth";

export async function knotFetch(
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const url = `${env.KNOT_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: knotAuthHeader(),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[knot] ${res.status} ${res.statusText}: ${body}`);
  }

  return res.json();
}
