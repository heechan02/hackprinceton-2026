import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { attachment, text } from "spectrum-ts";
import { adminClient } from "@/services/supabase/admin";
import { route } from "./commandRouter";
import { env } from "@/lib/env";
import type { OutboxStatus } from "@/types/db";

async function main() {
  const app = await Spectrum({
    projectId: env.PHOTON_PROJECT_ID,
    projectSecret: env.PHOTON_PROJECT_SECRET,
    providers: [imessage.config()],
  });

  // On boot: reclaim any rows stuck in 'sending' from a prior crashed worker
  await adminClient
    .from("outbox")
    .update({ status: "pending" as OutboxStatus })
    .eq("status", "sending" as OutboxStatus);

  console.log("agent ready");

  // Outbox drainer — separate async loop
  const drainer = (async () => {
    while (true) {
      try {
        const { data: rows } = await adminClient
          .from("outbox")
          .update({ status: "sending" as OutboxStatus })
          .eq("status", "pending" as OutboxStatus)
          .select()
          .limit(5);
        for (const row of rows ?? []) {
          try {
            const im = imessage(app);
            const user = await im.user(row.recipient_phone);
            const space = await im.space(user);
            if (row.attachment_path && !row.attachment_path.startsWith("http")) {
              await space.send(text(row.body), attachment(row.attachment_path));
            } else {
              await space.send(text(row.body));
            }
            await adminClient
              .from("outbox")
              .update({
                status: "sent" as OutboxStatus,
                sent_at: new Date().toISOString(),
              })
              .eq("id", row.id);
          } catch (err: unknown) {
            await adminClient
              .from("outbox")
              .update({
                status: "failed" as OutboxStatus,
                error: String(err instanceof Error ? err.message : err),
              })
              .eq("id", row.id);
          }
        }
      } catch (err) {
        console.error("[drainer] Supabase error:", err);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  })();

  // Inbound loop
  for await (const [space, message] of app.messages) {
    console.log("[inbound] incoming:", message.sender.id, message.content);
    if (message.content.type !== "text") continue;
    if (message.sender.id !== env.CARETAKER_PHONE) continue; // soft auth
    const msgText = message.content.text;
    try {
      await space.responding(async () => {
        const reply = await route({
          from: message.sender.id,
          text: msgText,
        });
        await space.send(text(reply));
      });
    } catch (err) {
      console.error("[inbound] Error handling message:", err);
    }
  }

  await drainer;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
