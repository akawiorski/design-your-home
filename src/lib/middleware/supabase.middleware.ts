import { defineMiddleware } from "astro:middleware";
import { supabaseClient, supabaseServiceClient, createSupabaseServerInstance } from "../../db/supabase.client";

/**
 * Supabase client setup middleware
 * Initializes Supabase clients and makes them available in context.locals
 *
 * Responsibilities:
 * - Create server-side Supabase instance with session context
 * - Attach both regular and admin clients to context
 */
export const setupSupabase = defineMiddleware(async (context, next) => {
  // Create server-side Supabase instance with session context
  const serverSupabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Use server-side client with session context, fallback to basic client
  context.locals.supabase = serverSupabase ?? supabaseClient;
  context.locals.supabaseAdmin = supabaseServiceClient ?? supabaseClient;

  return next();
});
