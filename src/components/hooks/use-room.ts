import { useCallback, useEffect, useState } from "react";

import type { RoomWithPhotosDTO } from "@/types";
import { ApiError, getRoom } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useUnauthorizedRedirect } from "@/components/hooks/use-unauthorized-redirect";

type RoomViewState =
  | { status: "idle" | "loading" }
  | { status: "success" }
  | { status: "error"; error: { message: string; code?: string } };

interface UseRoomResult {
  room: RoomWithPhotosDTO | null;
  state: RoomViewState;
  refresh: () => Promise<void>;
}

export function useRoom(roomId: string): UseRoomResult {
  const [room, setRoom] = useState<RoomWithPhotosDTO | null>(null);
  const [state, setState] = useState<RoomViewState>({ status: "idle" });
  const redirectToLogin = useUnauthorizedRedirect();

  const refresh = useCallback(async () => {
    if (!roomId) {
      setState({ status: "error", error: { message: "Brak identyfikatora pokoju." } });
      return;
    }

    setState({ status: "loading" });

    try {
      const data = await getRoom(roomId);
      setRoom(data);
      setState({ status: "success" });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          redirectToLogin();
          return;
        }

        setState({ status: "error", error: { message: error.message, code: error.code } });
        toast({ variant: "destructive", title: "Błąd", description: error.message });
        return;
      }

      const message = "Problem z połączeniem. Spróbuj ponownie.";
      setState({ status: "error", error: { message } });
      toast({ variant: "destructive", title: "Błąd", description: message });
    }
  }, [redirectToLogin, roomId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { room, state, refresh };
}
