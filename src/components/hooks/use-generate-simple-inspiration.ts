import { useCallback, useState } from "react";

import type { GenerateSimpleInspirationCommand, GenerateSimpleInspirationResponse } from "@/types";
import { ApiError, generateSimpleInspiration } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useUnauthorizedRedirect } from "@/components/hooks/use-unauthorized-redirect";

type GenerateSimpleState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: { message: string; code?: string } };

interface UseGenerateSimpleInspirationResult {
  state: GenerateSimpleState;
  generate: (payload: GenerateSimpleInspirationCommand) => Promise<GenerateSimpleInspirationResponse | null>;
}

export function useGenerateSimpleInspiration(roomId: string): UseGenerateSimpleInspirationResult {
  const [state, setState] = useState<GenerateSimpleState>({ status: "idle" });
  const redirectToLogin = useUnauthorizedRedirect();

  const generate = useCallback(
    async (payload: GenerateSimpleInspirationCommand) => {
      if (!roomId) {
        setState({ status: "error", error: { message: "Brak identyfikatora pokoju." } });
        return null;
      }

      setState({ status: "loading" });

      try {
        const result = await generateSimpleInspiration(roomId, payload);
        setState({ status: "idle" });
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            redirectToLogin();
            return null;
          }

          const message = error.status === 501 ? "Generowanie jest chwilowo niedostępne." : error.message;

          setState({ status: "error", error: { message, code: error.code } });
          toast({ variant: "destructive", title: "Błąd", description: message });
          return null;
        }

        const message = error instanceof Error ? error.message : "Problem z połączeniem. Spróbuj ponownie.";
        setState({ status: "error", error: { message } });
        toast({ variant: "destructive", title: "Błąd", description: message });
        return null;
      }
    },
    [redirectToLogin, roomId]
  );

  return { state, generate };
}
