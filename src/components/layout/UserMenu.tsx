import { useState } from "react";
import { Button } from "../ui/button";
import logger from "../../lib/logger";

export default function UserMenu({ userEmail }: { userEmail?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      // Use API endpoint for server-side logout
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        logger.error("Logout error");
      }

      // Always redirect to login after logout attempt
      window.location.href = "/login";
    } catch (error) {
      logger.error({ err: error }, "Logout error");
      // Still redirect even on error
      window.location.href = "/login";
    }
  };

  return (
    <div className="flex items-center gap-4">
      {userEmail && <span className="text-sm text-gray-600">{userEmail}</span>}
      <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
        {isLoading ? "Wylogowywanie..." : "Wyloguj"}
      </Button>
    </div>
  );
}
