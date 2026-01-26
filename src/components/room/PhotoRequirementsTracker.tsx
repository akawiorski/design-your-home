import { ValidationRules } from "@/types";

interface PhotoRequirementsTrackerProps {
  counts: { room: number; inspiration: number };
}

export function PhotoRequirementsTracker({ counts }: PhotoRequirementsTrackerProps) {
  const isRoomReady = counts.room >= ValidationRules.MIN_ROOM_PHOTOS;
  const isInspirationReady = counts.inspiration >= ValidationRules.MIN_INSPIRATION_PHOTOS;

  return (
    <section
      className="rounded-xl border border-border/70 bg-card/95 p-5 shadow-sm"
      aria-live="polite"
      data-testid="requirements-tracker"
    >
      <h2 className="text-lg font-semibold" data-testid="requirements-tracker-title">
        Wymagania generacji
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        <li
          className={`flex items-center justify-between ${isRoomReady ? "text-foreground" : "text-muted-foreground"}`}
          data-testid="requirement-room"
        >
          <span>Min. 1 zdjęcie pomieszczenia</span>
          <span data-testid="requirement-room-count">
            {counts.room}/{ValidationRules.MIN_ROOM_PHOTOS}
          </span>
        </li>
        <li
          className={`flex items-center justify-between ${
            isInspirationReady ? "text-foreground" : "text-muted-foreground"
          }`}
          data-testid="requirement-inspiration"
        >
          <span>Min. 2 zdjęcia inspiracji</span>
          <span data-testid="requirement-inspiration-count">
            {counts.inspiration}/{ValidationRules.MIN_INSPIRATION_PHOTOS}
          </span>
        </li>
      </ul>
    </section>
  );
}
