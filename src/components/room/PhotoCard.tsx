interface PhotoCardVM {
  id: string;
  url: string;
  alt: string;
  description?: string | null;
  createdAtLabel: string;
}

export function PhotoCard({ photo }: { photo: PhotoCardVM }) {
  return (
    <article className="rounded-lg border bg-background p-3">
      <img src={photo.url} alt={photo.alt} className="h-40 w-full rounded-md object-cover" loading="lazy" />
      <div className="mt-2 text-xs text-muted-foreground">{photo.createdAtLabel}</div>
      {photo.description ? <p className="mt-1 text-sm">{photo.description}</p> : null}
    </article>
  );
}
