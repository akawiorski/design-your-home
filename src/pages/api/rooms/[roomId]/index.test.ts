import type { APIContext } from "astro";
import type { SupabaseClient } from "../../../../db/supabase.client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RoomPhotoDTO } from "../../../../types";

const getRoomWithTypeByIdMock = vi.fn();
const getRoomPhotosMock = vi.fn();
const getPhotoCountsByTypeMock = vi.fn();

const buildContext = (overrides: Partial<APIContext> = {}): APIContext =>
  ({
    locals: {
      supabase: {} as SupabaseClient,
      user: {
        id: "user-123",
      },
    },
    params: {
      roomId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    },
    ...overrides,
  }) as APIContext;

describe("GET /api/rooms/{roomId}", () => {
  let GET: (context: APIContext) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();

    getRoomWithTypeByIdMock.mockReset();
    getRoomPhotosMock.mockReset();
    getPhotoCountsByTypeMock.mockReset();

    vi.doMock("../../../../lib/services/rooms.service", () => ({
      getRoomWithTypeById: getRoomWithTypeByIdMock,
    }));

    vi.doMock("../../../../lib/services/photos.service", () => ({
      getRoomPhotos: getRoomPhotosMock,
      getPhotoCountsByType: getPhotoCountsByTypeMock,
    }));

    ({ GET } = await import("./index"));
  });

  it("returns 500 when Supabase client is missing", async () => {
    const response = await GET(buildContext({ locals: { supabase: null } }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("SUPABASE_NOT_CONFIGURED");
  });

  it("returns 400 for invalid roomId", async () => {
    const response = await GET(buildContext({ params: { roomId: "not-a-uuid" } }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("INVALID_PARAMS");
  });

  it("returns 404 when room does not exist", async () => {
    getRoomWithTypeByIdMock.mockResolvedValue(null);

    const response = await GET(buildContext());

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when room is not owned by user", async () => {
    getRoomWithTypeByIdMock.mockResolvedValue({
      id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
      userId: "someone-else",
      roomType: { id: 1, name: "kitchen", displayName: "Kuchnia" },
      createdAt: "2026-01-11T10:00:00Z",
      updatedAt: "2026-01-11T10:00:00Z",
    });

    const response = await GET(buildContext());

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 with room details, photos and counts", async () => {
    getRoomWithTypeByIdMock.mockResolvedValue({
      id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
      userId: "user-123",
      roomType: { id: 1, name: "kitchen", displayName: "Kuchnia" },
      createdAt: "2026-01-11T10:00:00Z",
      updatedAt: "2026-01-11T10:00:00Z",
    });

    const photos: RoomPhotoDTO[] = [
      {
        id: "photo-1",
        roomId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
        photoType: "room",
        storagePath: "users/user-123/rooms/room-1/room/a.jpg",
        description: "Kitchen view",
        url: "https://example.com/a.jpg",
        createdAt: "2026-01-11T10:00:00Z",
      },
    ];

    getRoomPhotosMock.mockResolvedValue(photos);
    getPhotoCountsByTypeMock.mockResolvedValue({ room: 1, inspiration: 2, total: 3 });

    const response = await GET(buildContext());

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.id).toBe("d290f1ee-6c54-4b01-90e6-d701748f0851");
    expect(body.roomType.displayName).toBe("Kuchnia");
    expect(body.photoCount).toEqual({ room: 1, inspiration: 2 });
    expect(body.photos).toHaveLength(1);
    expect(body.createdAt).toBe("2026-01-11T10:00:00Z");
    expect(body.updatedAt).toBe("2026-01-11T10:00:00Z");
  });
});

describe("GET /api/rooms/{roomId} - unauthenticated", () => {
  let GET: (context: APIContext) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();

    getRoomWithTypeByIdMock.mockReset();
    getRoomPhotosMock.mockReset();
    getPhotoCountsByTypeMock.mockReset();

    vi.doMock("../../../../lib/services/rooms.service", () => ({
      getRoomWithTypeById: getRoomWithTypeByIdMock,
    }));

    vi.doMock("../../../../lib/services/photos.service", () => ({
      getRoomPhotos: getRoomPhotosMock,
      getPhotoCountsByType: getPhotoCountsByTypeMock,
    }));

    ({ GET } = await import("./index"));
  });

  it("returns 401 when authentication is missing", async () => {
    const response = await GET(buildContext({ locals: { supabase: {} as SupabaseClient, user: null } }));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });
});
