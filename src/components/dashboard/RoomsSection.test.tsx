import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RoomCardVM, RoomsViewState } from "./types";
import { RoomsSection } from "./RoomsSection";

describe("RoomsSection", () => {
  afterEach(() => {
    cleanup();
  });

  const mockRooms: RoomCardVM[] = [
    {
      id: "room-1",
      href: "/rooms/room-1",
      title: "Sypialnia",
      photoCount: { room: 2, inspiration: 3 },
      createdAtLabel: "20.01.2026",
      updatedAtLabel: "21.01.2026",
    },
    {
      id: "room-2",
      href: "/rooms/room-2",
      title: "Kuchnia",
      photoCount: { room: 1, inspiration: 0 },
      createdAtLabel: "22.01.2026",
      updatedAtLabel: "22.01.2026",
    },
  ];

  it("renders section heading and description", () => {
    const state: RoomsViewState = { status: "success" };
    render(<RoomsSection state={state} rooms={[]} onRetry={vi.fn()} onCreateFirstRoom={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Twoje pokoje" })).toBeInTheDocument();
    expect(screen.getByText("Kliknij kartę, aby przejść do szczegółów pokoju.")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    const state: RoomsViewState = { status: "loading" };
    render(<RoomsSection state={state} rooms={[]} onRetry={vi.fn()} onCreateFirstRoom={vi.fn()} />);

    expect(screen.getByText("Ładowanie pokoi...")).toBeInTheDocument();
  });

  it("shows idle state as loading", () => {
    const state: RoomsViewState = { status: "idle" };
    render(<RoomsSection state={state} rooms={[]} onRetry={vi.fn()} onCreateFirstRoom={vi.fn()} />);

    expect(screen.getByText("Ładowanie pokoi...")).toBeInTheDocument();
  });

  it("shows error state with message", () => {
    const state: RoomsViewState = { status: "error", error: { message: "Błąd serwera" } };
    render(<RoomsSection state={state} rooms={[]} onRetry={vi.fn()} onCreateFirstRoom={vi.fn()} />);

    expect(screen.getByText("Błąd serwera")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spróbuj ponownie" })).toBeInTheDocument();
  });

  it("calls onRetry when retry button clicked", () => {
    const handleRetry = vi.fn();
    const state: RoomsViewState = { status: "error", error: { message: "Błąd" } };
    render(<RoomsSection state={state} rooms={[]} onRetry={handleRetry} onCreateFirstRoom={vi.fn()} />);

    const retryButton = screen.getByRole("button", { name: "Spróbuj ponownie" });
    fireEvent.click(retryButton);

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no rooms", () => {
    const state: RoomsViewState = { status: "success" };
    render(<RoomsSection state={state} rooms={[]} onRetry={vi.fn()} onCreateFirstRoom={vi.fn()} />);

    expect(screen.getByText("Brak pokoi")).toBeInTheDocument();
    expect(
      screen.getByText("Utwórz pierwszy pokój, aby zacząć dodawać zdjęcia i generować inspiracje.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stwórz swój pierwszy pokój" })).toBeInTheDocument();
  });

  it("calls onCreateFirstRoom when button clicked", () => {
    const handleCreate = vi.fn();
    const state: RoomsViewState = { status: "success" };
    render(<RoomsSection state={state} rooms={[]} onRetry={vi.fn()} onCreateFirstRoom={handleCreate} />);

    const createButton = screen.getByRole("button", { name: "Stwórz swój pierwszy pokój" });
    fireEvent.click(createButton);

    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it("displays rooms when available", () => {
    const state: RoomsViewState = { status: "success" };
    render(<RoomsSection state={state} rooms={mockRooms} onRetry={vi.fn()} onCreateFirstRoom={vi.fn()} />);

    expect(screen.getByText("Sypialnia")).toBeInTheDocument();
    expect(screen.getByText("Kuchnia")).toBeInTheDocument();
    expect(screen.getByText(/Zdjęcia: pomieszczenie 2 \/ inspiracje 3/)).toBeInTheDocument();
  });

  it("does not render rooms grid during loading", () => {
    const state: RoomsViewState = { status: "loading" };
    const { container } = render(
      <RoomsSection state={state} rooms={mockRooms} onRetry={vi.fn()} onCreateFirstRoom={vi.fn()} />
    );

    const grid = container.querySelector(".grid");
    expect(grid).not.toBeInTheDocument();
    expect(screen.getByText("Ładowanie pokoi...")).toBeInTheDocument();
  });

  it("does not render rooms grid during error", () => {
    const state: RoomsViewState = { status: "error", error: { message: "Błąd" } };
    const { container } = render(
      <RoomsSection state={state} rooms={mockRooms} onRetry={vi.fn()} onCreateFirstRoom={vi.fn()} />
    );

    const grid = container.querySelector(".grid");
    expect(grid).not.toBeInTheDocument();
    expect(screen.getByText("Błąd")).toBeInTheDocument();
  });
});
