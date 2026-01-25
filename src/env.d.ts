import type { SupabaseClient } from "./db/supabase.client";
import type { Session } from "@supabase/supabase-js";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient | null;
      supabaseAdmin?: SupabaseClient | null;
      user?: { id: string; email?: string | undefined } | null;
      session?: Session | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
