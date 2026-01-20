import { createClient, type SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = BaseSupabaseClient<Database>;

export const DEFAULT_USER_ID = "525b1489-40a7-470a-afc4-65f1aa737cfe";
