import { createServerClient, parseCookieHeader, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY } from "astro:env/server";

import logger from "../lib/logger";

logger.info(
  { url: SUPABASE_URL, key: SUPABASE_KEY, admin: SUPABASE_SERVICE_ROLE_KEY, mode: import.meta.env.MODE },
  "[SUPABASE_URL] Initializing Supabase client with URL"
);

// Server-side Supabase client with cookie management
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

interface SupabaseContext {
  headers: Headers;
  cookies: AstroCookies;
}

import { createClient } from "@supabase/supabase-js";
const createSupabaseInstance = (apiKey: string | undefined, context: SupabaseContext) => {
  if (!apiKey) {
    logger.warn({ hasServiceKey: Boolean(apiKey) }, "Supabase API key is not provided, will not create client");
    return null;
  }

  // If this is the service role key, create a plain client that uses the
  // service role for Authorization (bypasses RLS). The SSR helper attaches
  // cookie-based auth and may use session auth instead of the provided key,
  // which can cause RLS to apply.
  if (apiKey === SUPABASE_SERVICE_ROLE_KEY) {
    logger.info({ usingAdminClient: true }, "Creating Supabase admin client using service role key");
    return createClient(SUPABASE_URL, apiKey);
  }

  return createServerClient(SUPABASE_URL, apiKey, {
    cookieOptions,
    cookies: {
      // @ts-expect-error - correct implementation per Supabase docs
      getAll() {
        const cookieHeader = context.headers.get("Cookie") ?? "";
        return parseCookieHeader(cookieHeader);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });
};

export const createSupabaseServerInstance = (context: SupabaseContext) => {
  return createSupabaseInstance(SUPABASE_KEY, context);
};

export const createSupabaseAdminInstance = (context: SupabaseContext) => {
  return createSupabaseInstance(SUPABASE_SERVICE_ROLE_KEY, context);
};
