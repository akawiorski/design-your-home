import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance, createSupabaseAdminInstance } from "../../db/supabase.client";

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

  // Use server-side client with session context, fallback to basic client
  context.locals.supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });
  context.locals.supabaseAdmin = createSupabaseAdminInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  return next();
});
