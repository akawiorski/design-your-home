interface ResultVM {
  id: string;
  createdAtLabel: string;
  bulletPoints: string[];
  images: { url: string; position: 1 | 2 }[];
}

interface GenerationResultsListProps {
  results: ResultVM[];
  isLoading: boolean;
}

export function GenerationResultsList({ results, isLoading }: GenerationResultsListProps) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="text-lg font-semibold">Wyniki generacji</h2>
      {isLoading ? <p className="mt-3 text-sm text-muted-foreground">Ładowanie wyników...</p> : null}
      {results.length === 0 && !isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Brak wygenerowanych inspiracji.</p>
      ) : null}
      <div className="mt-4 space-y-6">
        {results.map((result) => (
          <article key={result.id} className="rounded-lg border bg-background p-4">
            <div className="text-xs text-muted-foreground">{result.createdAtLabel}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {result.images.map((image) => (
                <img
                  key={`${result.id}-${image.position}`}
                  src={image.url}
                  alt={`Wygenerowany wariant ${image.position}`}
                  className="h-48 w-full rounded-md object-cover"
                />
              ))}
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {result.bulletPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
