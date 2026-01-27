import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RoomDTO, RoomTypeDTO } from "@/types";
import { CreateRoomDialog } from "./CreateRoomDialog";

const getRoomTypesMock = vi.fn();
const createRoomMock = vi.fn();
const toastMock = vi.fn();
const useUnauthorizedRedirectMock = vi.fn();

vi.mock("@/lib/api", () => ({
  getRoomTypes: () => getRoomTypesMock(),
  createRoom: (data: unknown) => createRoomMock(data),
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number,
      public code?: string
    ) {
      super(message);
    }
  },
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: (options: unknown) => toastMock(options),
}));

vi.mock("@/components/hooks/use-unauthorized-redirect", () => ({
  useUnauthorizedRedirect: () => useUnauthorizedRedirectMock(),
}));

describe("CreateRoomDialog", () => {
  const redirectToLogin = vi.fn();
  const handleOpenChange = vi.fn();
  const handleCreated = vi.fn();

  const mockRoomTypes: RoomTypeDTO[] = [
    { id: 1, name: "bedroom", displayName: "Sypialnia" },
    { id: 2, name: "kitchen", displayName: "Kuchnia" },
    { id: 3, name: "bathroom", displayName: "Łazienka" },
  ];

  const mockRoom: RoomDTO = {
    id: "room-1",
    roomType: mockRoomTypes[0],
    photoCount: { room: 0, inspiration: 0 },
    createdAt: "2026-01-25T10:00:00.000Z",
    updatedAt: "2026-01-25T10:00:00.000Z",
  };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    getRoomTypesMock.mockReset().mockResolvedValue({ roomTypes: mockRoomTypes });
    createRoomMock.mockReset().mockResolvedValue(mockRoom);
    toastMock.mockReset();
    redirectToLogin.mockReset();
    handleOpenChange.mockReset();
    handleCreated.mockReset();
    useUnauthorizedRedirectMock.mockReturnValue(redirectToLogin);
  });

  it("renders dialog title and description", async () => {
    render(<CreateRoomDialog open onOpenChange={handleOpenChange} onCreated={handleCreated} />);

    expect(screen.getByText("Utwórz pokój")).toBeInTheDocument();
    expect(screen.getByText("Wybierz typ pomieszczenia, aby rozpocząć pracę.")).toBeInTheDocument();

    await waitFor(() => {
      expect(getRoomTypesMock).toHaveBeenCalled();
    });
  });

  it("loads room types when opened", async () => {
    render(<CreateRoomDialog open onOpenChange={handleOpenChange} onCreated={handleCreated} />);

    await waitFor(() => {
      expect(getRoomTypesMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Sypialnia")).toBeInTheDocument();
    expect(screen.getByText("Kuchnia")).toBeInTheDocument();
    expect(screen.getByText("Łazienka")).toBeInTheDocument();
  });

  it("shows loading state while fetching room types", () => {
    getRoomTypesMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10_000)));
    render(<CreateRoomDialog open onOpenChange={handleOpenChange} onCreated={handleCreated} />);

    expect(screen.getByText("Ładowanie typów...")).toBeInTheDocument();
  });

  it("sorts room types alphabetically", async () => {
    render(<CreateRoomDialog open onOpenChange={handleOpenChange} onCreated={handleCreated} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const options = screen.getAllByRole("option");
    const roomTypeOptions = options.slice(1); // Skip "Wybierz..." option
    const labels = roomTypeOptions.map((opt) => opt.textContent);

    expect(labels).toEqual(["Kuchnia", "Łazienka", "Sypialnia"]);
  });

  it("creates room when form submitted with valid data", async () => {
    render(<CreateRoomDialog open onOpenChange={handleOpenChange} onCreated={handleCreated} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1" } });

    const createButton = screen.getByRole("button", { name: "Utwórz" });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(createRoomMock).toHaveBeenCalledWith({ roomTypeId: 1 });
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith({
        title: "Sukces",
        description: "Pokój został utworzony.",
      });
      expect(handleOpenChange).toHaveBeenCalledWith(false);
      expect(handleCreated).toHaveBeenCalledWith(mockRoom);
    });
  });

  it("disables submit button when no room type selected", async () => {
    render(<CreateRoomDialog open onOpenChange={handleOpenChange} onCreated={handleCreated} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const createButton = screen.getByRole("button", { name: "Utwórz" });
    expect(createButton).toBeDisabled();
  });

  it("enables submit button when room type selected", async () => {
    render(<CreateRoomDialog open onOpenChange={handleOpenChange} onCreated={handleCreated} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1" } });

    const createButton = screen.getByRole("button", { name: "Utwórz" });
    expect(createButton).not.toBeDisabled();
  });

  it("shows loading state during submission", async () => {
    createRoomMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10_000)));
    render(<CreateRoomDialog open onOpenChange={handleOpenChange} onCreated={handleCreated} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1" } });

    const createButton = screen.getByRole("button", { name: "Utwórz" });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText("Tworzenie...")).toBeInTheDocument();
    });
  });

  it("calls cancel handler when cancel button clicked", async () => {
    render(<CreateRoomDialog open onOpenChange={handleOpenChange} onCreated={handleCreated} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: "Anuluj" });
    fireEvent.click(cancelButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
