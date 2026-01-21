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
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <a className="text-sm text-muted-foreground hover:text-foreground" href="/dashboard">
          ← Wróć do dashboardu
        </a>
        <h1 className="mt-2 text-2xl font-semibold">{vm.title}</h1>
      </div>

      <dl className="grid gap-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between gap-4">
          <dt>Utworzono</dt>
          <dd className="text-foreground">{vm.createdAtLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>Zaktualizowano</dt>
          <dd className="text-foreground">{vm.updatedAtLabel}</dd>
        </div>
      </dl>
    </header>
  );
}
