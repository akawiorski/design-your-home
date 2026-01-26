interface PhotoCardVM {
  id: string;
  url: string;
  alt: string;
  description?: string | null;
  createdAtLabel: string;
}

export function PhotoCard({ photo }: { photo: PhotoCardVM }) {
  return (
    <article className="rounded-lg border bg-background p-3" data-testid="photo-card" data-photo-id={photo.id}>
      <img
        src={photo.url}
        alt={photo.alt}
        className="h-40 w-full rounded-md object-cover"
        loading="lazy"
        data-testid="photo-card-image"
      />
      <div className="mt-2 text-xs text-muted-foreground" data-testid="photo-card-date">
        {photo.createdAtLabel}
      </div>
      {photo.description ? (
        <p className="mt-1 text-sm" data-testid="photo-card-description">
          {photo.description}
        </p>
      ) : null}
    </article>
  );
}
