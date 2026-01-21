import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface GenerateSectionProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function GenerateSection({
  prompt,
  onPromptChange,
  canGenerate,
  isGenerating,
  onGenerate,
}: GenerateSectionProps) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="text-lg font-semibold">Generowanie</h2>
      <p className="mt-1 text-sm text-muted-foreground">Opcjonalnie dodaj krótki opis, aby lepiej dopasować wynik.</p>
      <textarea
        className="mt-3 w-full rounded-md border bg-background p-3 text-sm"
        rows={4}
        maxLength={200}
        placeholder="Np. jasne drewno, styl skandynawski, dużo światła"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
      />
      <Button className="mt-4 w-full" type="button" disabled={!canGenerate || isGenerating} onClick={onGenerate}>
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            Generowanie...
          </span>
        ) : (
          "Generuj"
        )}
      </Button>
    </section>
  );
}
