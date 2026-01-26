import { useCallback, useEffect, useMemo, useState } from "react";

import type { CreateRoomCommand, RoomDTO, RoomTypeDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError, createRoom, getRoomTypes } from "@/lib/api";
import { useUnauthorizedRedirect } from "@/components/hooks/use-unauthorized-redirect";

type LoadState = "idle" | "loading" | "success" | "error";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (room: RoomDTO) => void;
}

export function CreateRoomDialog({ open, onOpenChange, onCreated }: CreateRoomDialogProps) {
  const [roomTypesState, setRoomTypesState] = useState<LoadState>("idle");
  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>([]);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [submitState, setSubmitState] = useState<LoadState>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const redirectToLogin = useUnauthorizedRedirect();

  const canSubmit = selectedRoomTypeId !== null && submitState !== "loading";

  const resetForm = useCallback(() => {
    setSelectedRoomTypeId(null);
    setSubmitState("idle");
    setFormError(null);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        resetForm();
      }
    },
    [onOpenChange, resetForm]
  );

  useEffect(() => {
    const loadRoomTypes = async () => {
      if (!open) {
        return;
      }

      if (roomTypesState === "success" && roomTypes.length > 0) {
        return;
      }

      setRoomTypesState("loading");

      try {
        const data = await getRoomTypes();
        setRoomTypes(data.roomTypes);
        setRoomTypesState("success");
        setFormError(null);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          redirectToLogin();
          return;
        }

        const message = error instanceof ApiError ? error.message : "Problem z połączeniem. Spróbuj ponownie.";
        setRoomTypesState("error");
        setFormError(message);
      }
    };

    void loadRoomTypes();
  }, [open, redirectToLogin, roomTypes.length, roomTypesState]);

  const sortedRoomTypes = useMemo(
    () => [...roomTypes].sort((a, b) => a.displayName.localeCompare(b.displayName, "pl")),
    [roomTypes]
  );

  const submit = useCallback(async () => {
    setFormError(null);

    if (selectedRoomTypeId === null) {
      setFormError("Wybierz typ pokoju.");
      return;
    }

    if (submitState === "loading") {
      return;
    }

    setSubmitState("loading");

    const payload: CreateRoomCommand = {
      roomTypeId: selectedRoomTypeId,
    };

    try {
      const room = await createRoom(payload);

      toast({ title: "Sukces", description: "Pokój został utworzony." });
      setSubmitState("success");
      handleOpenChange(false);
      onCreated(room);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToLogin();
        return;
      }

      const message = error instanceof ApiError ? error.message : "Problem z połączeniem. Spróbuj ponownie.";
      setFormError(message);
      toast({ variant: "destructive", title: "Błąd", description: message });
      setSubmitState("error");
    }
  }, [handleOpenChange, onCreated, redirectToLogin, selectedRoomTypeId, submitState]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="create-room-dialog">
        <DialogHeader>
          <DialogTitle data-testid="create-room-dialog-title">Utwórz pokój</DialogTitle>
          <DialogDescription>Wybierz typ pomieszczenia, aby rozpocząć pracę.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="room-type">
            Typ pokoju
          </label>

          {roomTypesState === "loading" ? (
            <div
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
              data-testid="room-types-loading"
            >
              <Spinner size="sm" />
              <span aria-live="polite">Ładowanie typów...</span>
            </div>
          ) : null}

          {roomTypesState !== "loading" ? (
            <select
              id="room-type"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedRoomTypeId ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (!raw) {
                  setSelectedRoomTypeId(null);
                  return;
                }
                const parsed = Number(raw);
                setSelectedRoomTypeId(Number.isFinite(parsed) ? parsed : null);
              }}
              data-testid="room-type-select"
            >
              <option value="">Wybierz...</option>
              {sortedRoomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.displayName}
                </option>
              ))}
            </select>
          ) : null}

          {formError ? (
            <p className="text-sm text-destructive" role="alert" data-testid="create-room-error">
              {formError}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitState === "loading"}
            data-testid="create-room-cancel-button"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            aria-busy={submitState === "loading"}
            data-testid="create-room-submit-button"
          >
            {submitState === "loading" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" className="text-primary-foreground" />
                Tworzenie...
              </span>
            ) : (
              "Utwórz"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
