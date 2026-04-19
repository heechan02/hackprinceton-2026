# Step 3: Photon Spectrum app + outbound send

## Context

Spectrum (`spectrum-ts`) is a unified messaging SDK. It's initialized once as an app with providers, then exposes messages as an async iterator. Cloud mode is default — no server URL needed, just projectId + projectSecret.

The SDK shape is:

```typescript
import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

const app = await Spectrum({
  projectId: "...",
  projectSecret: "...",
  providers: [imessage.config()], // cloud mode is default
});

for await (const [space, message] of app.messages) {
  if (message.content.type === "text") {
    await space.send("hello");
  }
}
```

To send an outbound message to a specific phone number (not in response to an incoming one), use platform narrowing:

```typescript
const im = imessage(app);
const user = await im.user("+15551234567");
const space = await im.space(user);
await space.send("Notification text");
```

## Task

Create `src/services/photon/app.ts`:

- Export `createSpectrumApp()` that returns a Promise<SpectrumApp> initialized with env credentials and the imessage provider in cloud mode
- Do NOT call this at Next.js module load — it's only used by the agent worker process

Create `src/services/photon/outbound.ts` with:

```typescript
export async function sendToPhone(
  app: SpectrumApp,
  phone: string,
  ...content: ContentInput[]
): Promise<{ ok: boolean; error?: string }>;
export async function sendTextWithImage(
  app: SpectrumApp,
  phone: string,
  text: string,
  imagePath: string,
): Promise<{ ok: boolean; error?: string }>;
```

Both should use `imessage(app).user(phone)` then `im.space(user).send(...)` and wrap in try/catch returning the result object.

Create `scripts/smoke-photon.ts`:

- Instantiates the app
- Calls `sendToPhone(app, process.env.CARETAKER_PHONE, "NannyCam is online 👋 " + new Date().toISOString())`
- Calls `await app.stop()` and exits

## AC

- `npx tsx scripts/smoke-photon.ts` delivers an iMessage to the caretaker's phone within 10 seconds (user will confirm by showing their iPhone)
- Script exits cleanly (no hanging process)
- All credentials read from env via `src/lib/env.ts`
- `sendToPhone` returns `{ ok: false, error }` instead of throwing on failure

## Blocked criteria

- If Spectrum rejects the credentials, status = blocked with the exact error message so the user can check the dashboard
- If `imessage.config()` requires parameters not documented in the Spectrum README pasted below, status = blocked

## Reference

[https://github.com/photon-hq/spectrum-ts/blob/main/README.md]
