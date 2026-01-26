import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { RoomsViewState, RoomCardVM } from "@/components/dashboard/types";
import { RoomsGrid } from "@/components/dashboard/RoomsGrid";

interface RoomsSectionProps {
  state: RoomsViewState;
  rooms: RoomCardVM[];
  onRetry: () => void;
  onCreateFirstRoom: () => void;
}

export function RoomsSection({ state, rooms, onRetry, onCreateFirstRoom }: RoomsSectionProps) {
  return (
    <section className="mt-10" aria-labelledby="rooms-title" data-testid="rooms-section">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="rooms-title" className="text-xl font-semibold" data-testid="rooms-section-title">
            Twoje pokoje
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Kliknij kartę, aby przejść do szczegółów pokoju.</p>
        </div>
      </div>

      <div className="mt-6">
        {state.status === "loading" || state.status === "idle" ? (
          <div
            className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-4 text-sm text-muted-foreground"
            data-testid="rooms-loading"
          >
            <Spinner size="sm" />
            <span aria-live="polite">Ładowanie pokoi...</span>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4" data-testid="rooms-error">
            <p className="text-sm text-destructive" role="alert" data-testid="rooms-error-message">
              {state.error.message}
            </p>
            <div className="mt-3">
              <Button type="button" variant="outline" onClick={onRetry} data-testid="rooms-retry-button">
                Spróbuj ponownie
              </Button>
            </div>
          </div>
        ) : null}

        {state.status === "success" && rooms.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center" data-testid="rooms-empty-state">
            <h3 className="text-lg font-semibold" data-testid="rooms-empty-title">
              Brak pokoi
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Utwórz pierwszy pokój, aby zacząć dodawać zdjęcia i generować inspiracje.
            </p>
            <div className="mt-5">
              <Button type="button" onClick={onCreateFirstRoom} data-testid="create-first-room-button">
                Stwórz swój pierwszy pokój
              </Button>
            </div>
          </div>
        ) : null}

        {state.status === "success" && rooms.length > 0 ? <RoomsGrid rooms={rooms} /> : null}
      </div>
    </section>
  );
}
