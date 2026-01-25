import { createClient, type SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_KEY;

export const createSupabaseClient = (url?: string, key?: string) => {
  if (!url || !key) {
    return null;
  }

  return createClient<Database>(url, key);
};

export const supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey);
export const supabaseServiceClient = createSupabaseClient(supabaseUrl, supabaseKey);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const isSupabaseServiceConfigured = Boolean(supabaseUrl && supabaseKey);

export type SupabaseClient = BaseSupabaseClient<Database>;

export const DEFAULT_USER_ID = "525b1489-40a7-470a-afc4-65f1aa737cfe";

// Server-side Supabase client with cookie management
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD, // Only secure in production
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  if (!supabaseUrl || !supabaseKey) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[Supabase] Missing configuration:", {
        hasUrl: Boolean(supabaseUrl),
        hasKey: Boolean(supabaseKey),
      });
    }
    return null;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
