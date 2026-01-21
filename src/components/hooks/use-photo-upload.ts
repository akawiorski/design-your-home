import { useCallback, useState } from "react";

import type { CreateRoomPhotoCommand, GetUploadUrlCommand, PhotoType } from "@/types";
import { ValidationRules, isValidPhotoContentType } from "@/types";
import { ApiError, confirmPhoto, getUploadUrl, trackAnalyticsEvent } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useUnauthorizedRedirect } from "@/components/hooks/use-unauthorized-redirect";

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "error"; error: { message: string; code?: string } };

interface UploadOptions {
  photoType: PhotoType;
  description?: string;
}

interface UsePhotoUploadResult {
  state: UploadState;
  upload: (file: File, options: UploadOptions) => Promise<void>;
}

const MAX_FILE_SIZE_BYTES = ValidationRules.MAX_FILE_SIZE_MB * 1024 * 1024;

export function usePhotoUpload(roomId: string, onSuccess?: () => void): UsePhotoUploadResult {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const redirectToLogin = useUnauthorizedRedirect();

  const upload = useCallback(
    async (file: File, options: UploadOptions) => {
      if (!roomId) {
        setState({ status: "error", error: { message: "Brak identyfikatora pokoju." } });
        return;
      }

      if (!file) {
        setState({ status: "error", error: { message: "Nie wybrano pliku do uploadu." } });
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setState({
          status: "error",
          error: { message: `Maksymalny rozmiar pliku to ${ValidationRules.MAX_FILE_SIZE_MB} MB.` },
        });
        return;
      }

      if (!isValidPhotoContentType(file.type)) {
        setState({
          status: "error",
          error: { message: "Obsługiwane formaty: JPG, PNG, HEIC." },
        });
        return;
      }

      setState({ status: "uploading" });

      try {
        const uploadPayload: GetUploadUrlCommand = {
          photoType: options.photoType,
          fileName: file.name,
          contentType: file.type,
        };

        const uploadUrlData = await getUploadUrl(roomId, uploadPayload);

        const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Nie udało się przesłać pliku do storage.");
        }

        const confirmPayload: CreateRoomPhotoCommand = {
          photoId: uploadUrlData.photoId,
          storagePath: uploadUrlData.storagePath,
          photoType: options.photoType,
          description: options.description,
        };

        await confirmPhoto(roomId, confirmPayload);

        try {
          await trackAnalyticsEvent({
            eventType: "PhotoUploaded",
            eventData: {
              photoId: uploadUrlData.photoId,
              roomId,
              photoType: options.photoType,
            },
          });
        } catch {
          // Tracking errors should not block the upload flow.
        }

        setState({ status: "idle" });
        toast({ title: "Dodano zdjęcie", description: "Zdjęcie zostało pomyślnie zapisane." });
        onSuccess?.();
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

        const message = error instanceof Error ? error.message : "Problem z połączeniem. Spróbuj ponownie.";
        setState({ status: "error", error: { message } });
        toast({ variant: "destructive", title: "Błąd", description: message });
      }
    },
    [onSuccess, redirectToLogin, roomId]
  );

  return { state, upload };
}
