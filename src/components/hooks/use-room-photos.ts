import { useCallback, useEffect, useMemo, useState } from "react";

import type { RoomPhotoDTO } from "@/types";
import { ApiError, getRoomPhotos } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useUnauthorizedRedirect } from "@/components/hooks/use-unauthorized-redirect";

type PhotosViewState =
  | { status: "idle" | "loading" }
  | { status: "success" }
  | { status: "error"; error: { message: string; code?: string } };

interface CountsState {
  room: number;
  inspiration: number;
  total: number;
}

interface UseRoomPhotosResult {
  photos: RoomPhotoDTO[];
  counts: CountsState;
  state: PhotosViewState;
  refresh: () => Promise<void>;
}

export function useRoomPhotos(roomId: string): UseRoomPhotosResult {
  const [photos, setPhotos] = useState<RoomPhotoDTO[]>([]);
  const [counts, setCounts] = useState<CountsState>({ room: 0, inspiration: 0, total: 0 });
  const [state, setState] = useState<PhotosViewState>({ status: "idle" });
  const redirectToLogin = useUnauthorizedRedirect();

  const refresh = useCallback(async () => {
    if (!roomId) {
      setState({ status: "error", error: { message: "Brak identyfikatora pokoju." } });
      return;
    }

    setState({ status: "loading" });

    try {
      const data = await getRoomPhotos(roomId);
      setPhotos(data.photos);
      setCounts(data.counts);
      setState({ status: "success" });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          redirectToLogin();
          return;
        }

        if (error.status === 404) {
          setPhotos([]);
          setCounts({ room: 0, inspiration: 0, total: 0 });
          setState({ status: "success" });
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

  const sortedPhotos = useMemo(() => photos, [photos]);

  return { photos: sortedPhotos, counts, state, refresh };
}
