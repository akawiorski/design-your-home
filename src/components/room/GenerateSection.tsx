import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface GenerateSectionProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  canGenerateDescription: boolean;
  isGeneratingDescription: boolean;
  onGenerateDescription: () => void;
  descriptionResult?: string | null;
  descriptionImageUrl?: string | null;
}

export function GenerateSection({
  prompt,
  onPromptChange,
  canGenerate,
  isGenerating,
  onGenerate,
  canGenerateDescription,
  isGeneratingDescription,
  onGenerateDescription,
  descriptionResult,
  descriptionImageUrl,
}: GenerateSectionProps) {
  return (
    <section className="rounded-xl border border-border/70 bg-card/95 p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Generowanie</h2>
      <p className="mt-1 text-sm text-muted-foreground">Opcjonalnie dodaj krótki opis, aby lepiej dopasować wynik.</p>
      <textarea
        className="mt-3 w-full rounded-md border bg-background p-3 text-sm shadow-sm"
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
      <Button
        className="mt-3 w-full"
        type="button"
        variant="secondary"
        disabled={!canGenerateDescription || isGeneratingDescription}
        onClick={onGenerateDescription}
      >
        {isGeneratingDescription ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            Generowanie opisu...
          </span>
        ) : (
          "Generuj opis"
        )}
      </Button>
      {descriptionResult || descriptionImageUrl ? (
        <div className="mt-4 rounded-lg border bg-background p-3 text-sm text-foreground">
          <p className="font-medium">Opis aranżacji</p>
          {descriptionImageUrl ? (
            <img
              className="mt-3 w-full rounded-lg border object-cover"
              src={descriptionImageUrl}
              alt="Wygenerowana inspiracja"
              loading="lazy"
            />
          ) : null}
          <p className="mt-2 whitespace-pre-line text-muted-foreground">{descriptionResult}</p>
        </div>
      ) : null}
    </section>
  );
}
