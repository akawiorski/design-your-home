import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { RoomCardVM } from "./types";
import { RoomCard } from "./RoomCard";

describe("RoomCard", () => {
  afterEach(() => {
    cleanup();
  });

  const mockRoom: RoomCardVM = {
    id: "room-1",
    href: "/rooms/room-1",
    title: "Sypialnia",
    photoCount: { room: 2, inspiration: 3 },
    createdAtLabel: "20.01.2026",
    updatedAtLabel: "21.01.2026",
  };

  it("renders room title", () => {
    render(<RoomCard room={mockRoom} />);

    expect(screen.getByText("Sypialnia")).toBeInTheDocument();
  });

  it("renders photo counts", () => {
    render(<RoomCard room={mockRoom} />);

    expect(screen.getByText(/Zdjęcia: pomieszczenie 2 \/ inspiracje 3/)).toBeInTheDocument();
  });

  it("renders creation date", () => {
    render(<RoomCard room={mockRoom} />);

    expect(screen.getByText("Utworzono")).toBeInTheDocument();
    expect(screen.getByText("20.01.2026")).toBeInTheDocument();
  });

  it("renders update date", () => {
    render(<RoomCard room={mockRoom} />);

    expect(screen.getByText("Aktualizacja")).toBeInTheDocument();
    expect(screen.getByText("21.01.2026")).toBeInTheDocument();
  });

  it("renders as link with correct href", () => {
    render(<RoomCard room={mockRoom} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/rooms/room-1");
  });

  it("renders arrow indicator", () => {
    render(<RoomCard room={mockRoom} />);

    expect(screen.getByText("→")).toBeInTheDocument();
  });

  it("renders with zero photo counts", () => {
    const emptyRoom: RoomCardVM = {
      ...mockRoom,
      photoCount: { room: 0, inspiration: 0 },
    };

    render(<RoomCard room={emptyRoom} />);

    expect(screen.getByText(/Zdjęcia: pomieszczenie 0 \/ inspiracje 0/)).toBeInTheDocument();
  });
});
