import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoomPage } from "./RoomPage";

const useRoomMock = vi.fn();
const useRoomPhotosMock = vi.fn();
const usePhotoUploadMock = vi.fn();
const useGenerateInspirationMock = vi.fn();
const useUploadDescriptionsMock = vi.fn();

vi.mock("@/components/hooks/use-room", () => ({
  useRoom: (...args: unknown[]) => useRoomMock(...args),
}));

vi.mock("@/components/hooks/use-room-photos", () => ({
  useRoomPhotos: (...args: unknown[]) => useRoomPhotosMock(...args),
}));

vi.mock("@/components/hooks/use-photo-upload", () => ({
  usePhotoUpload: (...args: unknown[]) => usePhotoUploadMock(...args),
}));

vi.mock("@/components/hooks/use-generate-inspiration", () => ({
  useGenerateInspiration: (...args: unknown[]) => useGenerateInspirationMock(...args),
}));

vi.mock("@/components/hooks/use-upload-description", () => ({
  useUploadDescriptions: (...args: unknown[]) => useUploadDescriptionsMock(...args),
}));

describe("RoomPage", () => {
  const uploadMock = vi.fn();
  const generateMock = vi.fn();
  const setDescriptionMock = vi.fn();

  beforeEach(() => {
    uploadMock.mockReset().mockResolvedValue(undefined);
    generateMock.mockReset();
    setDescriptionMock.mockReset();

    useRoomMock.mockReturnValue({
      room: {
        id: "room-1",
        roomType: { id: 1, name: "bedroom", displayName: "Sypialnia" },
        photoCount: { room: 1, inspiration: 2 },
        createdAt: "2025-01-01T10:00:00.000Z",
        updatedAt: "2025-01-02T10:00:00.000Z",
        photos: [],
      },
      state: { status: "success" },
      refresh: vi.fn(),
    });

    useRoomPhotosMock.mockReturnValue({
      photos: [],
      counts: { room: 1, inspiration: 2, total: 3 },
      state: { status: "success" },
      refresh: vi.fn(),
    });

    usePhotoUploadMock.mockReturnValue({
      state: { status: "idle" },
      upload: uploadMock,
    });

    useGenerateInspirationMock.mockReturnValue({
      state: { status: "idle" },
      generate: generateMock,
    });

    useUploadDescriptionsMock.mockReturnValue({
      descriptions: { room: "Pokój", inspiration: "Inspiracja" },
      setDescription: setDescriptionMock,
    });
  });

  it("renders room header and sections", () => {
    render(<RoomPage roomId="room-1" />);

    expect(screen.getByRole("heading", { name: "Sypialnia" })).toBeInTheDocument();
    expect(screen.getByText("Zdjęcia Twojego pomieszczenia")).toBeInTheDocument();
    expect(screen.getByText("Twoje inspiracje")).toBeInTheDocument();
    expect(screen.getByText("Wyniki generacji")).toBeInTheDocument();
  });

  it("uploads photo when file selected", async () => {
    const { container } = render(<RoomPage roomId="room-1" />);
    const inputs = container.querySelectorAll('input[type="file"]');
    const file = new File(["file"], "room.jpg", { type: "image/jpeg" });

    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledWith(file, { photoType: "room", description: "Pokój" });
    });

    await waitFor(() => {
      expect(setDescriptionMock).toHaveBeenCalledWith("room", "");
    });
  });

  it("generates inspiration and renders result", async () => {
    generateMock.mockResolvedValue({
      roomId: "room-1",
      bulletPoints: ["Nowy pomysł"],
      images: [
        { url: "/image-1.png", position: 1 },
        { url: "/image-2.png", position: 2 },
      ],
    });

    render(<RoomPage roomId="room-1" />);

    const promptInput = screen.getAllByPlaceholderText("Np. jasne drewno, styl skandynawski, dużo światła")[0];
    fireEvent.change(promptInput, { target: { value: "  jasny styl  " } });
    const generateButton = screen.getAllByRole("button", { name: "Generuj" })[0];
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(generateMock).toHaveBeenCalledWith({ prompt: "jasny styl" });
    });

    expect(await screen.findByText("Nowy pomysł")).toBeInTheDocument();
  });
});
