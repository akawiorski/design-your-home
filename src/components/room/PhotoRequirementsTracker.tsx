import { ValidationRules } from "@/types";

interface PhotoRequirementsTrackerProps {
  counts: { room: number; inspiration: number };
}

export function PhotoRequirementsTracker({ counts }: PhotoRequirementsTrackerProps) {
  const isRoomReady = counts.room >= ValidationRules.MIN_ROOM_PHOTOS;
  const isInspirationReady = counts.inspiration >= ValidationRules.MIN_INSPIRATION_PHOTOS;

  return (
    <section className="rounded-lg border bg-card p-5" aria-live="polite">
      <h2 className="text-lg font-semibold">Wymagania generacji</h2>
      <ul className="mt-3 space-y-2 text-sm">
        <li
          className={`flex items-center justify-between ${isRoomReady ? "text-foreground" : "text-muted-foreground"}`}
        >
          <span>Min. 1 zdjęcie pomieszczenia</span>
          <span>
            {counts.room}/{ValidationRules.MIN_ROOM_PHOTOS}
          </span>
        </li>
        <li
          className={`flex items-center justify-between ${
            isInspirationReady ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <span>Min. 2 zdjęcia inspiracji</span>
          <span>
            {counts.inspiration}/{ValidationRules.MIN_INSPIRATION_PHOTOS}
          </span>
        </li>
      </ul>
    </section>
  );
}
