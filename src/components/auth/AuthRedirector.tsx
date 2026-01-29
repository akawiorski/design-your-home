import { useEffect, useState } from "react";
import { Spinner } from "../ui/spinner";
import logger from "../../lib/logger";

/**
 * AuthRedirector component
 *
 * Automatically checks user authentication status and redirects to the appropriate page:
 * - Redirects to /login if user is not authenticated
 * - Redirects to /dashboard if user is authenticated
 *
 * Displays a loading spinner during the session check.
 */
export function AuthRedirector({ serverUser }: { serverUser?: unknown } = {}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSafeReturnTo = () => {
      const params = new URLSearchParams(window.location.search);
      const rawReturnTo = params.get("returnTo");

      if (!rawReturnTo) {
        return null;
      }

      const trimmed = rawReturnTo.trim();

      if (!trimmed.startsWith("/")) {
        return null;
      }

      if (trimmed.startsWith("//") || trimmed.includes("://")) {
        return null;
      }

      return trimmed;
    };

    const checkSessionAndRedirect = () => {
      try {
        const returnTo = getSafeReturnTo();
        const safeAuthedTarget = returnTo && returnTo !== "/login" ? returnTo : "/dashboard";
        const safeLoginTarget =
          returnTo && returnTo !== "/login" ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";

        // If server-side rendered user is present, trust it and redirect to authed target.
        const serverAuthenticated = typeof serverUser !== "undefined" && !!serverUser;
        if (serverAuthenticated) {
          window.location.href = safeAuthedTarget;
          return;
        }

        // No server user -> treat as unauthenticated and redirect to login.
        window.location.href = safeLoginTarget;
      } catch (err) {
        logger.error({ err }, "Unexpected error during auth redirect");
        window.location.href = "/login";
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndRedirect();
  }, [serverUser]);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
      <span className="sr-only">Checking authentication status</span>
    </div>
  );
}
