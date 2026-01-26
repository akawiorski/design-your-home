import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupabaseClient } from "../../db/supabase.client";
import { createRoom, getRoomsByUserId, getRoomWithTypeById } from "./rooms.service";

describe("rooms.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("createRoom", () => {
    it("successfully creates a room", async () => {
      const mockRoomType = { id: 1, name: "bedroom", display_name: "Sypialnia" };
      const mockRoom = {
        id: "room-1",
        room_type_id: 1,
        created_at: "2026-01-25T10:00:00Z",
        updated_at: "2026-01-25T10:00:00Z",
      };

      // Mock room type fetch
      const mockRoomTypeSingle = vi.fn().mockResolvedValue({
        data: mockRoomType,
        error: null,
      });

      // Mock room creation
      const mockRoomSingle = vi.fn().mockResolvedValue({
        data: mockRoom,
        error: null,
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockRoomTypeSingle,
            }),
          }),
        } as ReturnType<typeof mockSupabase.from>)
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: mockRoomSingle,
            }),
          }),
        } as ReturnType<typeof mockSupabase.from>);

      const result = await createRoom(mockSupabase, "user-1", 1);

      expect(result).toEqual({
        id: "room-1",
        roomType: {
          id: 1,
          name: "bedroom",
          displayName: "Sypialnia",
        },
        photoCount: { room: 0, inspiration: 0 },
        createdAt: "2026-01-25T10:00:00Z",
        updatedAt: "2026-01-25T10:00:00Z",
      });
    });

    it("throws error when room type does not exist", async () => {
      const mockRoomTypeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockRoomTypeSingle,
          }),
        }),
      } as ReturnType<typeof mockSupabase.from>);

      await expect(createRoom(mockSupabase, "user-1", 999)).rejects.toThrow("Room type with id 999 not found");
    });

    it("throws error when room creation fails", async () => {
      const mockRoomType = { id: 1, name: "bedroom", display_name: "Sypialnia" };

      const mockRoomTypeSingle = vi.fn().mockResolvedValue({
        data: mockRoomType,
        error: null,
      });

      const mockRoomSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockRoomTypeSingle,
            }),
          }),
        } as ReturnType<typeof mockSupabase.from>)
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: mockRoomSingle,
            }),
          }),
        } as ReturnType<typeof mockSupabase.from>);

      await expect(createRoom(mockSupabase, "user-1", 1)).rejects.toThrow("Failed to create room: Insert failed");
    });
  });

  describe("getRoomsByUserId", () => {
    it("returns rooms with photo counts", async () => {
      const mockRooms = [
        {
          id: "room-1",
          room_type_id: 1,
          created_at: "2026-01-25T10:00:00Z",
          updated_at: "2026-01-25T10:00:00Z",
          room_types: { id: 1, name: "bedroom", display_name: "Sypialnia" },
        },
      ];

      const mockPhotos = [
        { room_id: "room-1", photo_type: "room" },
        { room_id: "room-1", photo_type: "room" },
        { room_id: "room-1", photo_type: "inspiration" },
      ];

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockRooms,
                error: null,
              }),
            }),
          }),
        } as ReturnType<typeof mockSupabase.from>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: mockPhotos,
              error: null,
            }),
          }),
        } as ReturnType<typeof mockSupabase.from>);

      const result = await getRoomsByUserId(mockSupabase, "user-1");

      expect(result).toEqual([
        {
          id: "room-1",
          roomType: {
            id: 1,
            name: "bedroom",
            displayName: "Sypialnia",
          },
          photoCount: { room: 2, inspiration: 1 },
          createdAt: "2026-01-25T10:00:00Z",
          updatedAt: "2026-01-25T10:00:00Z",
        },
      ]);
    });

    it("returns empty array when user has no rooms", async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as ReturnType<typeof mockSupabase.from>);

      const result = await getRoomsByUserId(mockSupabase, "user-1");

      expect(result).toEqual([]);
    });

    it("throws error when rooms query fails", async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      } as ReturnType<typeof mockSupabase.from>);

      await expect(getRoomsByUserId(mockSupabase, "user-1")).rejects.toThrow("Failed to fetch rooms: Database error");
    });
  });

  describe("getRoomWithTypeById", () => {
    it("returns room with type information", async () => {
      const mockRoom = {
        id: "room-1",
        user_id: "user-1",
        created_at: "2026-01-25T10:00:00Z",
        updated_at: "2026-01-25T10:00:00Z",
        room_types: { id: 1, name: "bedroom", display_name: "Sypialnia" },
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockRoom,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      } as ReturnType<typeof mockSupabase.from>);

      const result = await getRoomWithTypeById(mockSupabase, "room-1");

      expect(result).toEqual({
        id: "room-1",
        userId: "user-1",
        roomType: {
          id: 1,
          name: "bedroom",
          displayName: "Sypialnia",
        },
        createdAt: "2026-01-25T10:00:00Z",
        updatedAt: "2026-01-25T10:00:00Z",
      });
    });

    it("returns null when room does not exist", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      } as ReturnType<typeof mockSupabase.from>);

      const result = await getRoomWithTypeById(mockSupabase, "room-1");

      expect(result).toBeNull();
    });

    it("throws error when query fails", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      } as ReturnType<typeof mockSupabase.from>);

      await expect(getRoomWithTypeById(mockSupabase, "room-1")).rejects.toThrow("Failed to fetch room: Database error");
    });
  });
});
