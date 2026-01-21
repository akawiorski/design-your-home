import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onCreateClick: () => void;
  isCreateDisabled?: boolean;
}

export function DashboardHeader({ onCreateClick, isCreateDisabled }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Zarządzaj pokojami i szybko przechodź do dodawania zdjęć.</p>
      </div>

      <Button type="button" onClick={onCreateClick} disabled={isCreateDisabled}>
        Utwórz pokój
      </Button>
    </header>
  );
}
