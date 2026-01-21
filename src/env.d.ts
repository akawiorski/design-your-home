import type { SupabaseClient } from "./db/supabase.client";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient | null;
      supabaseAdmin?: SupabaseClient | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
