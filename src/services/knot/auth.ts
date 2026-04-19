import { env } from "@/lib/env";

export function knotAuthHeader(): string {
  const credentials = Buffer.from(
    `${env.KNOT_CLIENT_ID}:${env.KNOT_SECRET}`
  ).toString("base64");
  return `Basic ${credentials}`;
}
