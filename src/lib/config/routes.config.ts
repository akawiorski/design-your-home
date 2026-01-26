/**
 * Route configuration for application
 * Centralizes all route definitions and access control
 */

export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Protected routes
  DASHBOARD: "/dashboard",

  // API routes
  API: {
    AUTH: {
      LOGIN: "/api/auth/login",
      LOGOUT: "/api/auth/logout",
      REGISTER: "/api/auth/register",
    },
  },
} as const;

/**
 * Paths that don't require authentication
 */
export const PUBLIC_PATHS = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.API.AUTH.LOGIN,
  ROUTES.API.AUTH.LOGOUT,
  ROUTES.API.AUTH.REGISTER,
] as const;

/**
 * Paths that should redirect to dashboard if user is already authenticated
 */
export const AUTH_ONLY_PATHS = [ROUTES.LOGIN, ROUTES.REGISTER] as const;

/**
 * Default redirect path after login
 */
export const DEFAULT_PROTECTED_PATH = ROUTES.DASHBOARD;

/**
 * Check if path is public (doesn't require authentication)
 */
export const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATHS.includes(pathname as never);
};

/**
 * Check if path should redirect authenticated users
 */
export const isAuthOnlyPath = (pathname: string): boolean => {
  return AUTH_ONLY_PATHS.includes(pathname as never);
};
