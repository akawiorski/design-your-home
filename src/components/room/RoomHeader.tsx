interface RoomHeaderVM {
  roomId: string;
  title: string;
  createdAtLabel: string;
  updatedAtLabel: string;
}

interface RoomHeaderProps {
  vm: RoomHeaderVM;
}

export function RoomHeader({ vm }: RoomHeaderProps) {
  return (
    <header
      className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border/70 bg-card/95 p-4 shadow-sm"
      data-testid="room-header"
    >
      <div>
        <a
          className="text-sm text-muted-foreground hover:text-foreground"
          href="/dashboard"
          data-testid="back-to-dashboard-link"
        >
          ← Wróć do dashboardu
        </a>
        <h1 className="mt-2 text-2xl font-semibold" data-testid="room-title">
          {vm.title}
        </h1>
      </div>

      <dl className="grid gap-2 text-sm text-muted-foreground" data-testid="room-dates">
        <div className="flex items-center justify-between gap-4">
          <dt>Utworzono</dt>
          <dd className="text-foreground" data-testid="room-created-date">
            {vm.createdAtLabel}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>Zaktualizowano</dt>
          <dd className="text-foreground" data-testid="room-updated-date">
            {vm.updatedAtLabel}
          </dd>
        </div>
      </dl>
    </header>
  );
}
