import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabaseClient } from "../../db/supabase.client";
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
export function AuthRedirector() {
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

    const checkSessionAndRedirect = async () => {
      try {
        if (!isSupabaseConfigured || !supabaseClient) {
          logger.error("Supabase is not configured. Redirecting to login.");
          window.location.href = "/login";
          return;
        }

        const { data, error } = await supabaseClient.auth.getSession();

        const returnTo = getSafeReturnTo();
        const safeAuthedTarget = returnTo && returnTo !== "/login" ? returnTo : "/dashboard";
        const safeLoginTarget =
          returnTo && returnTo !== "/login" ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";

        // Handle Supabase errors
        if (error) {
          logger.error({ err: error }, "Error checking session");
          // On error, assume user is not authenticated and redirect to login
          window.location.href = safeLoginTarget;
          return;
        }

        // Redirect based on session existence
        if (data.session) {
          window.location.href = safeAuthedTarget;
        } else {
          window.location.href = safeLoginTarget;
        }
      } catch (err) {
        // Handle unexpected errors
        logger.error({ err }, "Unexpected error during session check");
        window.location.href = "/login";
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndRedirect();
  }, []);

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
