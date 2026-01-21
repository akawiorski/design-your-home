import { PhotoCard } from "@/components/room/PhotoCard";

interface PhotoCardVM {
  id: string;
  url: string;
  alt: string;
  description?: string | null;
  createdAtLabel: string;
}

export function PhotoGrid({ photos }: { photos: PhotoCardVM[] }) {
  if (photos.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Brak zdjęć w tej sekcji.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}
