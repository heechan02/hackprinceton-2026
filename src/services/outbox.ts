import { adminClient } from "@/services/supabase/admin";

export async function enqueueMessage(opts: {
  phone: string;
  body: string;
  attachmentPath?: string;
}): Promise<string> {
  const { data, error } = await adminClient
    .from("outbox")
    .insert({
      recipient_phone: opts.phone,
      body: opts.body,
      attachment_path: opts.attachmentPath ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`[outbox] Failed to enqueue: ${error.message}`);

  // Fire-and-forget flush so messages send immediately without the worker
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  fetch(`${baseUrl}/api/cron/flush-outbox`, { method: "POST" }).catch(() => {});

  return data.id;
}
