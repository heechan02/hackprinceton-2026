import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env";
import type { Database } from "@/types/db";

// Anon client — safe for browser use. Read-only in most contexts.
export const supabaseClient = createClient<Database>(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
