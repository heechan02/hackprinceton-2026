import { createSpectrumApp } from "../src/services/photon/app";
import { sendToPhone } from "../src/services/photon/outbound";
import { env } from "../src/lib/env";

async function main() {
  const app = await createSpectrumApp();
  const result = await sendToPhone(
    app,
    env.CARETAKER_PHONE,
    `NannyCam is online 👋 ${new Date().toISOString()}`,
  );
  if (!result.ok) {
    console.error("Failed to send message:", result.error);
    await app.stop();
    process.exit(1);
  }
  console.log("Message sent successfully");
  await app.stop();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
