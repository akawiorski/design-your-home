import { defineMiddleware } from "astro:middleware";

/**
 * Authentication middleware
 * Retrieves and validates user session from Supabase
 *
 * Responsibilities:
 * - Get user from Supabase Auth
 * - Store user info in context.locals
 * - Store session in context.locals
 * - Handle auth errors gracefully
 *
 * Prerequisites:
 * - setupSupabase middleware must run first
 */
export const setupAuth = defineMiddleware(async (context, next) => {
  const supabase = context.locals.supabase;

  if (!supabase) {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error("[Auth Middleware] Supabase client not available");
    }
    return next();
  }

  try {
    // Get user session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (import.meta.env.DEV) {
        console.error("[Auth Middleware] Failed to get user:", error.message);
      }
      return next();
    }

    if (user) {
      // Store user info in locals
      context.locals.user = {
        id: user.id,
        email: user.email,
      };

      // Store full session
      const { data: sessionData } = await supabase.auth.getSession();
      context.locals.session = sessionData.session;

      if (import.meta.env.DEV) {
        console.log("[Auth Middleware] User authenticated:", user.email);
      }
    }
  } catch (error) {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error("[Auth Middleware] Unexpected error:", error);
    }
  }

  return next();
});
