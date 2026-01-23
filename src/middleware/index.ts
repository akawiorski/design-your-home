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
  // Always provide client instances for backward compatibility
  context.locals.supabase = supabaseClient;
  context.locals.supabaseAdmin = supabaseServiceClient ?? supabaseClient;

  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.includes(context.url.pathname);

  // Create server-side Supabase instance for session management
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  if (supabase) {
    try {
      // Get user session
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        // Store user info in locals
        context.locals.user = {
          id: user.id,
          email: user.email,
        };

        // Optionally store full session
        const { data: sessionData } = await supabase.auth.getSession();
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
