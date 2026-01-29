import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthRedirector } from "./AuthRedirector";

const getSessionMock = vi.fn();

vi.mock("../../db/supabase.client", () => ({
  isSupabaseConfigured: true,
  supabaseClient: {
    auth: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  },
}));

const setTestLocation = (search = "") => {
  const normalizedSearch = search ? `?${search}` : "";
  const href = `http://localhost/${normalizedSearch}`;

  Object.defineProperty(window, "location", {
    value: {
      href,
      search: normalizedSearch,
    },
    writable: true,
    configurable: true,
  });
};

describe.skip("AuthRedirector", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    setTestLocation();
  });

  it("redirects to /dashboard when session exists", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });

    render(<AuthRedirector />);

    await waitFor(() => {
      expect(window.location.href).toBe("/dashboard");
    });
  });

  it("redirects to /login when no session", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<AuthRedirector />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });
  });

  it("uses returnTo when provided and authenticated", async () => {
    setTestLocation("returnTo=/rooms");

    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-2" } } },
      error: null,
    });

    render(<AuthRedirector />);

    await waitFor(() => {
      expect(window.location.href).toBe("/rooms");
    });
  });

  it("redirects to login with returnTo on error", async () => {
    setTestLocation("returnTo=/rooms");

    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: { message: "Auth failed" },
    });

    render(<AuthRedirector />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login?returnTo=%2Frooms");
    });
  });
});
