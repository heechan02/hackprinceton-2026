import { Spectrum, type SpectrumInstance } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { env } from "@/lib/env";

export type SpectrumApp = SpectrumInstance;

export async function createSpectrumApp(): Promise<SpectrumApp> {
  return Spectrum({
    projectId: env.PHOTON_PROJECT_ID,
    projectSecret: env.PHOTON_PROJECT_SECRET,
    providers: [imessage.config()],
  });
}
