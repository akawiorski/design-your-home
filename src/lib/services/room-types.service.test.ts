import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupabaseClient } from "../../db/supabase.client";
import { getAllRoomTypes } from "./room-types.service";

describe("room-types.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("getAllRoomTypes", () => {
    it("returns all room types successfully", async () => {
      const mockRoomTypes = [
        { id: 1, name: "bedroom", display_name: "Sypialnia" },
        { id: 2, name: "kitchen", display_name: "Kuchnia" },
        { id: 3, name: "bathroom", display_name: "Łazienka" },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockRoomTypes,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as ReturnType<typeof mockSupabase.from>);

      const result = await getAllRoomTypes(mockSupabase);

      expect(result).toEqual([
        { id: 1, name: "bedroom", displayName: "Sypialnia" },
        { id: 2, name: "kitchen", displayName: "Kuchnia" },
        { id: 3, name: "bathroom", displayName: "Łazienka" },
      ]);
      expect(mockSupabase.from).toHaveBeenCalledWith("room_types");
      expect(mockSelect).toHaveBeenCalledWith("id, name, display_name");
      expect(mockOrder).toHaveBeenCalledWith("id", { ascending: true });
    });

    it("returns empty array when no room types exist", async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as ReturnType<typeof mockSupabase.from>);

      const result = await getAllRoomTypes(mockSupabase);

      expect(result).toEqual([]);
    });

    it("throws error when query fails", async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as ReturnType<typeof mockSupabase.from>);

      await expect(getAllRoomTypes(mockSupabase)).rejects.toThrow("Failed to fetch room types: Database error");
    });

    it("returns empty array when data is null", async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as ReturnType<typeof mockSupabase.from>);

      const result = await getAllRoomTypes(mockSupabase);

      expect(result).toEqual([]);
    });
  });
});
