import { useRef } from "react";

import type { PhotoType } from "@/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PhotoGrid } from "@/components/room/PhotoGrid";

interface PhotoCardVM {
  id: string;
  url: string;
  alt: string;
  description?: string | null;
  createdAtLabel: string;
}

interface PhotosSectionProps {
  title: string;
  description: string;
  photoType: PhotoType;
  photos: PhotoCardVM[];
  countLabel: string;
  limitLabel: string;
  canUpload: boolean;
  isUploading: boolean;
  descriptionValue: string;
  onDescriptionChange: (value: string) => void;
  onUpload: (file: File) => void;
}

export function PhotosSection({
  title,
  description,
  photoType,
  photos,
  countLabel,
  limitLabel,
  canUpload,
  isUploading,
  descriptionValue,
  onDescriptionChange,
  onUpload,
}: PhotosSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section
      className="rounded-xl border border-border/70 bg-card/95 p-5 shadow-sm"
      aria-labelledby={`section-${photoType}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id={`section-${photoType}`} className="text-lg font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>{countLabel}</div>
          <div>{limitLabel}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="text-xs font-medium text-muted-foreground" htmlFor={`desc-${photoType}`}>
          Opis zdjęcia (opcjonalnie)
        </label>
        <input
          id={`desc-${photoType}`}
          type="text"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm"
          placeholder="Np. widok od wejścia"
          value={descriptionValue}
          maxLength={500}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/heic"
            disabled={!canUpload || isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onUpload(file);
                event.currentTarget.value = "";
              }
            }}
          />
          <Button
            type="button"
            disabled={!canUpload || isUploading}
            aria-label={`Dodaj zdjęcie ${photoType}`}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Wysyłanie...
              </span>
            ) : (
              "Dodaj zdjęcie"
            )}
          </Button>
          {!canUpload ? <span className="text-xs text-destructive">Limit zdjęć został osiągnięty.</span> : null}
        </div>
      </div>

      <PhotoGrid photos={photos} />
    </section>
  );
}
