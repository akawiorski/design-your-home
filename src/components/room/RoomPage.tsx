import { useCallback, useMemo, useState } from "react";

import type { PhotoType } from "@/types";
import { ValidationRules } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { useRoom } from "@/components/hooks/use-room";
import { useRoomPhotos } from "@/components/hooks/use-room-photos";
import { usePhotoUpload } from "@/components/hooks/use-photo-upload";
import { useGenerateInspiration } from "@/components/hooks/use-generate-inspiration";
import { useUploadDescriptions } from "@/components/hooks/use-upload-description";
import { RoomHeader } from "@/components/room/RoomHeader";
import { PhotosSection } from "@/components/room/PhotosSection";
import { PhotoRequirementsTracker } from "@/components/room/PhotoRequirementsTracker";
import { GenerateSection } from "@/components/room/GenerateSection";
import { GenerationResultsList } from "@/components/room/GenerationResultsList";
import { formatDate } from "@/components/room/RoomPage.helpers";
import { mapPhotoToCardVm } from "@/components/room/RoomPage.mappers";
import { roomSectionTitles } from "@/components/room/RoomPage.data";
import { buildResultId } from "@/components/room/RoomPage.utils";
import type { RoomPageState } from "@/components/room/RoomPage.state";
import type { RoomHeaderVM } from "@/components/room/RoomPage.vm";

interface RoomPageProps {
  roomId: string;
}

export function RoomPage({ roomId }: RoomPageProps) {
  const { room, state: roomState } = useRoom(roomId);
  const { photos, counts, state: photosState, refresh: refreshPhotos } = useRoomPhotos(roomId);
  const { descriptions, setDescription } = useUploadDescriptions();
  const { state: uploadState, upload } = usePhotoUpload(roomId, refreshPhotos);
  const { state: generateState, generate } = useGenerateInspiration(roomId);
  const [state, setState] = useState<RoomPageState>({
    prompt: "",
    results: [],
  });

  const canGenerate =
    counts.room >= ValidationRules.MIN_ROOM_PHOTOS &&
    counts.inspiration >= ValidationRules.MIN_INSPIRATION_PHOTOS &&
    generateState.status !== "loading";

  const photosByType = useMemo(() => {
    return {
      room: photos.filter((photo) => photo.photoType === "room"),
      inspiration: photos.filter((photo) => photo.photoType === "inspiration"),
    };
  }, [photos]);

  const handleUpload = useCallback(
    async (file: File, photoType: PhotoType) => {
      await upload(file, { photoType, description: descriptions[photoType] });
      setDescription(photoType, "");
    },
    [descriptions, setDescription, upload]
  );

  const handleGenerate = useCallback(async () => {
    const response = await generate({ prompt: state.prompt.trim() || undefined });
    if (response) {
      setState((prev) => ({
        prompt: "",
        results: [response, ...prev.results],
      }));
    }
  }, [generate, state.prompt]);

  if (roomState.status === "loading") {
    return (
      <div className="rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <span aria-live="polite">Ładowanie pokoju...</span>
        </div>
      </div>
    );
  }

  if (roomState.status === "error") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
        <p className="text-sm text-destructive" role="alert">
          {roomState.error.message}
        </p>
      </div>
    );
  }

  if (!room) {
    return <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Nie znaleziono pokoju.</div>;
  }

  const headerVm: RoomHeaderVM = {
    roomId: room.id,
    title: room.roomType.displayName,
    createdAtLabel: formatDate(room.createdAt),
    updatedAtLabel: formatDate(room.updatedAt),
  };

  return (
    <div className="space-y-8">
      <RoomHeader vm={headerVm} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <PhotosSection
            title={roomSectionTitles.room}
            description="Dodaj co najmniej jedno zdjęcie pomieszczenia w stanie niewykończonym."
            photoType="room"
            photos={photosByType.room.map(mapPhotoToCardVm)}
            countLabel={`room: ${counts.room}/${ValidationRules.MIN_ROOM_PHOTOS}`}
            limitLabel={`Limit łącznie: ${ValidationRules.MAX_PHOTOS_PER_ROOM}`}
            canUpload={counts.total < ValidationRules.MAX_PHOTOS_PER_ROOM}
            isUploading={uploadState.status === "uploading"}
            descriptionValue={descriptions.room}
            onDescriptionChange={(value) => setDescription("room", value)}
            onUpload={(file) => handleUpload(file, "room")}
          />

          <PhotosSection
            title={roomSectionTitles.inspiration}
            description="Dodaj minimum dwa zdjęcia inspiracji, które chcesz wykorzystać."
            photoType="inspiration"
            photos={photosByType.inspiration.map(mapPhotoToCardVm)}
            countLabel={`inspiration: ${counts.inspiration}/${ValidationRules.MIN_INSPIRATION_PHOTOS}`}
            limitLabel={`Limit łącznie: ${ValidationRules.MAX_PHOTOS_PER_ROOM}`}
            canUpload={counts.total < ValidationRules.MAX_PHOTOS_PER_ROOM}
            isUploading={uploadState.status === "uploading"}
            descriptionValue={descriptions.inspiration}
            onDescriptionChange={(value) => setDescription("inspiration", value)}
            onUpload={(file) => handleUpload(file, "inspiration")}
          />
        </div>

        <div className="space-y-6">
          <PhotoRequirementsTracker counts={counts} />
          <GenerateSection
            prompt={state.prompt}
            onPromptChange={(value: string) => setState((prev) => ({ ...prev, prompt: value }))}
            canGenerate={canGenerate}
            isGenerating={generateState.status === "loading"}
            onGenerate={handleGenerate}
          />
        </div>
      </div>

      <GenerationResultsList
        results={state.results.map((result) => ({
          id: buildResultId(result),
          createdAtLabel: new Date().toLocaleDateString("pl-PL"),
          bulletPoints: result.bulletPoints,
          images: result.images.map((image) => ({
            url: image.url,
            position: image.position,
          })),
        }))}
        isLoading={photosState.status === "loading"}
      />
    </div>
  );
}
