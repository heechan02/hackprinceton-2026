import { imessage } from "spectrum-ts/providers/imessage";
import { attachment, text } from "spectrum-ts";
import type { ContentInput } from "spectrum-ts";
import type { SpectrumApp } from "./app";

export async function sendToPhone(
  app: SpectrumApp,
  phone: string,
  ...content: ContentInput[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const im = imessage(app);
    const user = await im.user(phone);
    const space = await im.space(user);
    await space.send(...(content as [ContentInput, ...ContentInput[]]));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendTextWithImage(
  app: SpectrumApp,
  phone: string,
  body: string,
  imagePath: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const im = imessage(app);
    const user = await im.user(phone);
    const space = await im.space(user);
    await space.send(text(body), attachment(imagePath));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
