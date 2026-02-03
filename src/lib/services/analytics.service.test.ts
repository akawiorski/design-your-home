import { beforeEach, describe, expect, it, vi } from "vitest";

import { trackEvent, isSupportedEventType } from "./analytics.service";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("analytics.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("trackEvent", () => {
    it("successfully tracks an event", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "event-1" },
            error: null,
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await trackEvent(mockSupabase, "user-1", "RoomCreated", { roomId: "room-1" });

      expect(result).toBe("event-1");
      expect(mockSupabase.from).toHaveBeenCalledWith("analytics_events");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-1",
        event_type: "RoomCreated",
        event_data: { roomId: "room-1" },
      });
    });

    it("throws error when insert fails", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await expect(trackEvent(mockSupabase, "user-1", "RoomCreated", {})).rejects.toThrow(
        "Failed to track analytics event: Database error"
      );
    });
  });

  describe("isSupportedEventType", () => {
    it("returns true for supported event types", () => {
      expect(isSupportedEventType("InspirationGenerated")).toBe(true);
      expect(isSupportedEventType("RoomCreated")).toBe(true);
      expect(isSupportedEventType("PhotoUploaded")).toBe(true);
    });

    it("returns false for unsupported event types", () => {
      expect(isSupportedEventType("UnknownEvent")).toBe(false);
      expect(isSupportedEventType("")).toBe(false);
      expect(isSupportedEventType("roomcreated")).toBe(false);
    });
  });
});
