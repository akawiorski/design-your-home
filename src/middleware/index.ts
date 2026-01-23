import { defineMiddleware } from "astro:middleware";

import { supabaseClient, supabaseServiceClient, createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - accessible without authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
];

export const onRequest = defineMiddleware(async (context, next) => {
  // Create server-side Supabase instance with session context
  const serverSupabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Use server-side client with session context, fallback to basic client
  context.locals.supabase = serverSupabase ?? supabaseClient;
  context.locals.supabaseAdmin = supabaseServiceClient ?? supabaseClient;

  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.includes(context.url.pathname);

  if (serverSupabase) {
    try {
      // Get user session
      const {
        data: { user },
        error,
      } = await serverSupabase.auth.getUser();

      if (!error && user) {
        // Store user info in locals
        context.locals.user = {
          id: user.id,
          email: user.email,
        };

        // Optionally store full session
        const { data: sessionData } = await serverSupabase.auth.getSession();
        context.locals.session = sessionData.session;
      }
    } catch (error) {
      // Log error in development
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Middleware auth error:", error);
      }
    }
  }

  // Redirect to login if accessing protected route without authentication
  if (!isPublicPath && !context.locals.user) {
    return context.redirect(`/login?redirectTo=${encodeURIComponent(context.url.pathname)}`);
  }

  // If user is logged in and tries to access login/register, redirect to dashboard
  if (context.locals.user && (context.url.pathname === "/login" || context.url.pathname === "/register")) {
    return context.redirect("/dashboard");
  }

  return next();
});
