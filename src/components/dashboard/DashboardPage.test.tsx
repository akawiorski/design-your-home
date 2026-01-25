import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RoomDTO } from "@/types";
import { DashboardPage } from "./DashboardPage";

const useRoomsMock = vi.fn();

vi.mock("@/components/hooks/use-rooms", () => ({
  useRooms: () => useRoomsMock(),
}));

vi.mock("@/components/dashboard/CreateRoomDialog", () => ({
  CreateRoomDialog: ({ open, onCreated }: { open: boolean; onCreated: (room: RoomDTO) => void }) => {
    if (!open) return null;
    return (
      <div role="dialog">
        <p>Utwórz pokój</p>
        <button onClick={() => onCreated(mockRoom)}>Mock Create</button>
      </div>
    );
  },
}));

const mockRoom: RoomDTO = {
  id: "room-1",
  roomType: { id: 1, name: "bedroom", displayName: "Sypialnia" },
  photoCount: { room: 2, inspiration: 3 },
  createdAt: "2026-01-20T10:00:00.000Z",
  updatedAt: "2026-01-21T15:30:00.000Z",
  photos: [],
};

describe("DashboardPage", () => {
  const refreshMock = vi.fn();
  const addRoomMock = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    refreshMock.mockReset();
    addRoomMock.mockReset();
    delete (window as { location?: unknown }).location;
    window.location = { href: "" } as Location;

    useRoomsMock.mockReturnValue({
      rooms: [],
      state: { status: "success" },
      refresh: refreshMock,
      addRoom: addRoomMock,
    });
  });

  it("renders header and main sections", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Zarządzaj pokojami i szybko przechodź do dodawania zdjęć.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Twoje pokoje" })).toBeInTheDocument();
  });

  it("shows create room button", () => {
    render(<DashboardPage />);

    const createButton = screen.getByRole("button", { name: "Utwórz pokój" });
    expect(createButton).toBeInTheDocument();
    expect(createButton).not.toBeDisabled();
  });

  it("disables create button when rooms are loading", () => {
    useRoomsMock.mockReturnValue({
      rooms: [],
      state: { status: "loading" },
      refresh: refreshMock,
      addRoom: addRoomMock,
    });

    render(<DashboardPage />);

    const createButton = screen.getByRole("button", { name: "Utwórz pokój" });
    expect(createButton).toBeDisabled();
  });

  it("displays rooms when available", () => {
    useRoomsMock.mockReturnValue({
      rooms: [mockRoom],
      state: { status: "success" },
      refresh: refreshMock,
      addRoom: addRoomMock,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Sypialnia")).toBeInTheDocument();
    expect(screen.getByText(/Zdjęcia: pomieszczenie 2 \/ inspiracje 3/)).toBeInTheDocument();
  });

  it("formats dates correctly", () => {
    useRoomsMock.mockReturnValue({
      rooms: [mockRoom],
      state: { status: "success" },
      refresh: refreshMock,
      addRoom: addRoomMock,
    });

    render(<DashboardPage />);

    expect(screen.getByText("20.01.2026")).toBeInTheDocument();
    expect(screen.getByText("21.01.2026")).toBeInTheDocument();
  });

  it("opens create room dialog when button clicked", () => {
    render(<DashboardPage />);

    const createButton = screen.getByRole("button", { name: "Utwórz pokój" });
    fireEvent.click(createButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("navigates to room after creation", async () => {
    render(<DashboardPage />);

    const createButton = screen.getByRole("button", { name: "Utwórz pokój" });
    fireEvent.click(createButton);

    const mockCreateButton = screen.getByRole("button", { name: "Mock Create" });
    fireEvent.click(mockCreateButton);

    await waitFor(() => {
      expect(addRoomMock).toHaveBeenCalledWith(mockRoom);
      expect(window.location.href).toBe(`/rooms/${mockRoom.id}`);
    });
  });

  it("shows empty state when no rooms", () => {
    useRoomsMock.mockReturnValue({
      rooms: [],
      state: { status: "success" },
      refresh: refreshMock,
      addRoom: addRoomMock,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Brak pokoi")).toBeInTheDocument();
    expect(screen.getByText("Stwórz swój pierwszy pokój")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    useRoomsMock.mockReturnValue({
      rooms: [],
      state: { status: "loading" },
      refresh: refreshMock,
      addRoom: addRoomMock,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Ładowanie pokoi...")).toBeInTheDocument();
  });

  it("shows error state with retry button", () => {
    useRoomsMock.mockReturnValue({
      rooms: [],
      state: { status: "error", error: { message: "Błąd połączenia" } },
      refresh: refreshMock,
      addRoom: addRoomMock,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Błąd połączenia")).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: "Spróbuj ponownie" });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
