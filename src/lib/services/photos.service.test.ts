import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupabaseClient } from "../../db/supabase.client";
import {
  getPhotoCountByRoomId,
  verifyRoomOwnership,
  generateStoragePath,
  createPendingPhoto,
  getPhotoCountsByType,
} from "./photos.service";

describe("photos.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("getPhotoCountByRoomId", () => {
    it("returns photo count for a room", async () => {
      const mockIs = vi.fn().mockResolvedValue({
        count: 5,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: mockIs,
          }),
        }),
      } as any);

      const result = await getPhotoCountByRoomId(mockSupabase, "room-1");

      expect(result).toBe(5);
      expect(mockSupabase.from).toHaveBeenCalledWith("room_photos");
    });

    it("returns 0 when count is null", async () => {
      const mockIs = vi.fn().mockResolvedValue({
        count: null,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: mockIs,
          }),
        }),
      } as any);

      const result = await getPhotoCountByRoomId(mockSupabase, "room-1");

      expect(result).toBe(0);
    });

    it("throws error when query fails", async () => {
      const mockIs = vi.fn().mockResolvedValue({
        count: null,
        error: { message: "Database error" },
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: mockIs,
          }),
        }),
      } as any);

      await expect(getPhotoCountByRoomId(mockSupabase, "room-1")).rejects.toThrow(
        "Failed to fetch photo count: Database error"
      );
    });
  });

  describe("verifyRoomOwnership", () => {
    it("returns true when user owns the room", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: "room-1" },
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                maybeSingle: mockMaybeSingle,
              }),
            }),
          }),
        }),
      } as any);

      const result = await verifyRoomOwnership(mockSupabase, "room-1", "user-1");

      expect(result).toBe(true);
    });

    it("returns false when user does not own the room", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                maybeSingle: mockMaybeSingle,
              }),
            }),
          }),
        }),
      } as any);

      const result = await verifyRoomOwnership(mockSupabase, "room-1", "user-1");

      expect(result).toBe(false);
    });

    it("throws error when query fails", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                maybeSingle: mockMaybeSingle,
              }),
            }),
          }),
        }),
      } as any);

      await expect(verifyRoomOwnership(mockSupabase, "room-1", "user-1")).rejects.toThrow(
        "Failed to verify room ownership: Database error"
      );
    });
  });

  describe("generateStoragePath", () => {
    it("generates a storage path with correct structure", () => {
      const result = generateStoragePath("user-1", "room-1", "room", "photo.jpg");

      expect(result).toMatch(/^users\/user-1\/rooms\/room-1\/room\/\d+-[a-f0-9-]+\.jpg$/);
    });

    it("extracts file extension correctly", () => {
      const resultJpg = generateStoragePath("user-1", "room-1", "room", "photo.jpg");
      const resultPng = generateStoragePath("user-1", "room-1", "room", "photo.png");
      const resultHeic = generateStoragePath("user-1", "room-1", "room", "photo.HEIC");

      expect(resultJpg).toMatch(/\.jpg$/);
      expect(resultPng).toMatch(/\.png$/);
      expect(resultHeic).toMatch(/\.HEIC$/);
    });

    it("uses entire filename as extension when no dot is present", () => {
      const result = generateStoragePath("user-1", "room-1", "room", "photo");

      expect(result).toMatch(/\.photo$/);
    });

    it("includes photo type in path", () => {
      const roomPath = generateStoragePath("user-1", "room-1", "room", "photo.jpg");
      const inspirationPath = generateStoragePath("user-1", "room-1", "inspiration", "photo.jpg");

      expect(roomPath).toContain("/room/");
      expect(inspirationPath).toContain("/inspiration/");
    });
  });

  describe("createPendingPhoto", () => {
    it("creates a pending photo record", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: "photo-1" },
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      const result = await createPendingPhoto(mockSupabase, "photo-1", "room-1", "room", "path/to/photo.jpg");

      expect(result).toBe("photo-1");
      expect(mockSupabase.from).toHaveBeenCalledWith("room_photos");
    });

    it("throws error when insert fails", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      await expect(
        createPendingPhoto(mockSupabase, "photo-1", "room-1", "room", "path/to/photo.jpg")
      ).rejects.toThrow("Failed to create pending photo: Insert failed");
    });
  });

  describe("getPhotoCountsByType", () => {
    it("returns photo counts by type", async () => {
      const mockPhotos = [
        { photo_type: "room" },
        { photo_type: "room" },
        { photo_type: "inspiration" },
        { photo_type: "inspiration" },
        { photo_type: "inspiration" },
      ];

      const mockIs = vi.fn().mockResolvedValue({
        data: mockPhotos,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: mockIs,
          }),
        }),
      } as any);

      const result = await getPhotoCountsByType(mockSupabase, "room-1");

      expect(result).toEqual({
        room: 2,
        inspiration: 3,
        total: 5,
      });
    });

    it("returns zero counts when no photos exist", async () => {
      const mockIs = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: mockIs,
          }),
        }),
      } as any);

      const result = await getPhotoCountsByType(mockSupabase, "room-1");

      expect(result).toEqual({
        room: 0,
        inspiration: 0,
        total: 0,
      });
    });

    it("throws error when query fails", async () => {
      const mockIs = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: mockIs,
          }),
        }),
      } as any);

      await expect(getPhotoCountsByType(mockSupabase, "room-1")).rejects.toThrow(
        "Failed to fetch photo counts: Database error"
      );
    });
  });
});
