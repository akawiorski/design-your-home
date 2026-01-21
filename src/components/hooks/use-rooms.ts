import { useCallback, useEffect, useState } from "react";

import type { RoomDTO } from "@/types";
import type { RoomsViewState } from "@/components/dashboard/types";
import { toast } from "@/components/ui/use-toast";
import { ApiError, getRooms } from "@/lib/api";
import { useUnauthorizedRedirect } from "@/components/hooks/use-unauthorized-redirect";

interface UseRoomsResult {
  rooms: RoomDTO[];
  state: RoomsViewState;
  refresh: () => Promise<void>;
  addRoom: (room: RoomDTO) => void;
}

export function useRooms(): UseRoomsResult {
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [state, setState] = useState<RoomsViewState>({ status: "idle" });
  const redirectToLogin = useUnauthorizedRedirect();

  const refresh = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const data = await getRooms();
      setRooms(data.rooms);
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
  }, [redirectToLogin]);

  const addRoom = useCallback((room: RoomDTO) => {
    setRooms((prev) => [room, ...prev]);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rooms, state, refresh, addRoom };
}
