import { createClient, type SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const createSupabaseClient = (url?: string, key?: string) => {
  if (!url || !key) {
    return null;
  }

  return createClient<Database>(url, key);
};

export const supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
export const supabaseServiceClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseServiceConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

export type SupabaseClient = BaseSupabaseClient<Database>;

export const DEFAULT_USER_ID = "525b1489-40a7-470a-afc4-65f1aa737cfe";
