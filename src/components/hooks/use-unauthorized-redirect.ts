import { useCallback } from "react";

export function useUnauthorizedRedirect() {
  return useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    const redirectTo = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/login?redirectTo=${encodeURIComponent(redirectTo)}`;
  }, []);
}
