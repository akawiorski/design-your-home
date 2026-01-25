import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardHeader } from "./DashboardHeader";

describe("DashboardHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders header with title and description", () => {
    render(<DashboardHeader onCreateClick={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Zarządzaj pokojami i szybko przechodź do dodawania zdjęć.")).toBeInTheDocument();
  });

  it("renders create button", () => {
    render(<DashboardHeader onCreateClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Utwórz pokój" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("calls onCreateClick when button clicked", () => {
    const handleClick = vi.fn();
    render(<DashboardHeader onCreateClick={handleClick} />);

    const button = screen.getByRole("button", { name: "Utwórz pokój" });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disables button when isCreateDisabled is true", () => {
    render(<DashboardHeader onCreateClick={vi.fn()} isCreateDisabled />);

    const button = screen.getByRole("button", { name: "Utwórz pokój" });
    expect(button).toBeDisabled();
  });

  it("does not call onClick when button is disabled", () => {
    const handleClick = vi.fn();
    render(<DashboardHeader onCreateClick={handleClick} isCreateDisabled />);

    const button = screen.getByRole("button", { name: "Utwórz pokój" });
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });
});
