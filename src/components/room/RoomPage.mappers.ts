import type { RoomPhotoDTO } from "@/types";

import { formatDate } from "@/components/room/RoomPage.helpers";

export const mapPhotoToCardVm = (photo: RoomPhotoDTO) => ({
  id: photo.id,
  url: photo.url,
  alt: photo.description?.trim()
    ? photo.description
    : photo.photoType === "room"
      ? "Zdjęcie pomieszczenia"
      : "Zdjęcie inspiracji",
  description: photo.description,
  createdAtLabel: formatDate(photo.createdAt),
});
