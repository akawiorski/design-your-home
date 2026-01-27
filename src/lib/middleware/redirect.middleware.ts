import { defineMiddleware } from "astro:middleware";
import { isPublicPath, isAuthOnlyPath, DEFAULT_PROTECTED_PATH, ROUTES } from "../config/routes.config";

/**
 * Redirect middleware
 * Handles authentication-based redirects
 *
 * Responsibilities:
 * - Redirect unauthenticated users to login when accessing protected routes
 * - Redirect authenticated users away from login/register pages
 * - Preserve intended destination with redirectTo parameter
 *
 * Prerequisites:
 * - setupAuth middleware must run first to populate context.locals.user
 */
export const handleRedirects = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAuthenticated = !!context.locals.user;
  const isPublic = isPublicPath(pathname);
  const isAuthOnly = isAuthOnlyPath(pathname);

  // Case 1: Unauthenticated user trying to access protected route
  if (!isPublic && !isAuthenticated) {
    const redirectUrl = `${ROUTES.LOGIN}?redirectTo=${encodeURIComponent(pathname)}`;
    return context.redirect(redirectUrl);
  }

  // Case 2: Authenticated user trying to access login/register
  if (isAuthenticated && isAuthOnly) {
    return context.redirect(DEFAULT_PROTECTED_PATH);
  }

  return next();
});
