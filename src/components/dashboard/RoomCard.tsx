import type { RoomCardVM } from "@/components/dashboard/types";

export function RoomCard({ room }: { room: RoomCardVM }) {
  return (
    <a
      href={room.href}
      className="group block rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{room.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Zdjęcia: pomieszczenie {room.photoCount.room} / inspiracje {room.photoCount.inspiration}
          </p>
        </div>
        <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">→</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Utworzono</dt>
          <dd className="mt-0.5 font-medium">{room.createdAtLabel}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Aktualizacja</dt>
          <dd className="mt-0.5 font-medium">{room.updatedAtLabel}</dd>
        </div>
      </dl>
    </a>
  );
}
