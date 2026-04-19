# Step 4: Agent worker process with inbound command router

## Context

The agent worker is a standalone Node process (not a Next.js route) that:

1. Initializes the Spectrum app
2. Runs a single loop: reads inbound iMessages, routes them to commandRouter
3. Polls an `outbox` table in Supabase every 2s, sends any pending messages, marks them sent

This separation means Next.js routes only write to Supabase — they never touch Spectrum directly. This avoids the problem of serverless routes not being able to hold a long-lived connection.

## Task

Add to Supabase migration (new file `supabase/migrations/0002_outbox.sql`):

```sql
create table outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_phone text not null,
  body text not null,
  attachment_path text,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index outbox_pending on outbox(created_at) where status = 'pending';
```

Implement `src/agent/commandRouter.ts`:
Exports `route(input: { from: string; text: string }): Promise<string>` that returns the reply text.
Intent matching via regex (LLM upgrade later):

- /^status|how is (mom|dad|her|him|they)/i → summary of last 5 events from Supabase
- /^rules/i → formatted spending_rules for the active patient
- /^reorder\s+(.+)/i → insert event with kind=reorder, status=pending; reply "ok, queued for review"
- /^approve\s+(\w+)/i → update events.status='approved' where id matches; reply confirmation
- /^block\s+(\w+)/i → update events.status='blocked'; reply confirmation
- anything else → "Try: status, rules, approve <id>, block <id>, reorder <item>"

Implement `src/agent/worker.ts` — the main worker entrypoint:

```typescript
import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { supabaseAdmin } from "@/services/supabase/admin";
import { route } from "./commandRouter";
import { env } from "@/lib/env";

async function main() {
  const app = await Spectrum({
    projectId: env.PHOTON_PROJECT_ID,
    projectSecret: env.PHOTON_PROJECT_SECRET,
    providers: [imessage.config()],
  });

  // Outbox drainer — separate async loop
  const drainer = (async () => {
    while (true) {
      const { data: rows } = await supabaseAdmin
        .from("outbox")
        .update({ status: "sending" })
        .eq("status", "pending")
        .select()
        .limit(5);
      for (const row of rows ?? []) {
        try {
          const im = imessage(app);
          const user = await im.user(row.recipient_phone);
          const space = await im.space(user);
          // send text and optional attachment
          if (row.attachment_path) {
            await space.send(row.body /* attachment */);
          } else {
            await space.send(row.body);
          }
          await supabaseAdmin
            .from("outbox")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", row.id);
        } catch (err: any) {
          await supabaseAdmin
            .from("outbox")
            .update({
              status: "failed",
              error: String(err?.message ?? err),
            })
            .eq("id", row.id);
        }
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  })();

  // Inbound loop
  for await (const [space, message] of app.messages) {
    if (message.content.type !== "text") continue;
    if (message.sender.id !== env.CARETAKER_PHONE) continue; // soft auth
    await space.responding(async () => {
      const reply = await route({
        from: message.sender.id,
        text: message.content.text,
      });
      await space.send(reply);
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Add to `package.json`:

```json
"scripts": {
  "agent": "tsx src/agent/worker.ts"
}
```

Also expose a helper `src/services/outbox.ts`:

```typescript
export async function enqueueMessage(opts: {
  phone: string;
  body: string;
  attachmentPath?: string;
}): Promise<string>;
```

returning the outbox row id. API routes elsewhere in the app use this instead of touching Spectrum directly.

## AC

- `npm run agent` starts without error and shows "agent ready" in logs
- Sending "status" to the registered Spectrum phone from CARETAKER_PHONE produces a real reply drawn from Supabase events within 5 seconds
- Inserting a row into `outbox` table via SQL editor produces an iMessage within 4 seconds
- Messages from phones other than CARETAKER_PHONE are ignored (not replied to)
- Worker handles Supabase errors without crashing the loop
- Unit test for commandRouter intent matching covers each command kind

## Blocked criteria

- If Spectrum's inbound message stream never yields anything despite sending messages from the caretaker phone, set status=blocked — the user needs to verify their Spectrum project has the caretaker's phone registered or linked. (Check the dashboard "Users" tab.)

## Reference

[https://github.com/photon-hq/spectrum-ts/blob/main/README.md]
