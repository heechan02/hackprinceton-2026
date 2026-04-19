import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  KNOT_CLIENT_ID: z.string().min(1),
  KNOT_SECRET: z.string().min(1),
  KNOT_BASE_URL: z.string().url(),
  PHOTON_PROJECT_ID: z.string().min(1),
  PHOTON_PROJECT_SECRET: z.string().min(1),
  CARETAKER_PHONE: z.string().min(1),
});

function parseEnv() {
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`[env] Missing or invalid environment variables: ${missing}`);
  }
  return result.data;
}

// Server-only: throws at import time if any required var is missing
export const env = parseEnv();
