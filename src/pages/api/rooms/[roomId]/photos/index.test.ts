import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RoomPhotoDTO } from "../../../../../types";

const verifyRoomOwnershipMock = vi.fn();
const confirmPhotoUploadMock = vi.fn();

const buildContext = (overrides?: Partial<any>) =>
  ({
    locals: {
      supabase: {},
    },
    params: {
      roomId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    },
    request: {
      json: vi.fn(),
    },
    ...overrides,
  }) as any;

describe("POST /api/rooms/{roomId}/photos", () => {
  let POST: (context: any) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();

    verifyRoomOwnershipMock.mockReset();
    confirmPhotoUploadMock.mockReset();

    vi.doMock("../../../../../db/supabase.client", () => ({
      DEFAULT_USER_ID: "user-123",
    }));

    vi.doMock("../../../../../lib/services/photos.service", () => ({
      verifyRoomOwnership: verifyRoomOwnershipMock,
      confirmPhotoUpload: confirmPhotoUploadMock,
    }));

    ({ POST } = await import("./index"));
  });

  it("returns 400 when roomId param is invalid", async () => {
    const response = await POST(buildContext({ params: { roomId: "not-a-uuid" } }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("INVALID_PARAMS");
  });

  it("returns 400 when body is invalid", async () => {
    const context = buildContext();
    context.request.json.mockResolvedValue({ photoId: "bad" });

    const response = await POST(context);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when room is not owned", async () => {
    const context = buildContext();
    context.request.json.mockResolvedValue({
      photoId: "b6f5b6b5-2d4d-4e88-a3da-1a1d0c2fd031",
      storagePath: "users/user-123/rooms/room-1/room/a.jpg",
      photoType: "room",
    });

    verifyRoomOwnershipMock.mockResolvedValue(false);

    const response = await POST(context);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 404 when photo record is missing", async () => {
    const context = buildContext();
    context.request.json.mockResolvedValue({
      photoId: "b6f5b6b5-2d4d-4e88-a3da-1a1d0c2fd031",
      storagePath: "users/user-123/rooms/room-1/room/a.jpg",
      photoType: "room",
    });

    verifyRoomOwnershipMock.mockResolvedValue(true);
    confirmPhotoUploadMock.mockResolvedValue(null);

    const response = await POST(context);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 201 with created photo", async () => {
    const context = buildContext();
    context.request.json.mockResolvedValue({
      photoId: "b6f5b6b5-2d4d-4e88-a3da-1a1d0c2fd031",
      storagePath: "users/user-123/rooms/room-1/room/a.jpg",
      photoType: "room",
      description: "Kitchen view",
    });

    verifyRoomOwnershipMock.mockResolvedValue(true);

    const responsePhoto: RoomPhotoDTO = {
      id: "b6f5b6b5-2d4d-4e88-a3da-1a1d0c2fd031",
      roomId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
      photoType: "room",
      storagePath: "users/user-123/rooms/room-1/room/a.jpg",
      description: "Kitchen view",
      url: "https://example.com/a.jpg",
      createdAt: "2026-01-11T10:00:00Z",
    };

    confirmPhotoUploadMock.mockResolvedValue(responsePhoto);

    const response = await POST(context);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe(responsePhoto.id);
    expect(body.url).toBe(responsePhoto.url);
  });
});

describe("POST /api/rooms/{roomId}/photos - unauthenticated", () => {
  let POST: (context: any) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();

    verifyRoomOwnershipMock.mockReset();
    confirmPhotoUploadMock.mockReset();

    vi.doMock("../../../../../db/supabase.client", () => ({
      DEFAULT_USER_ID: "",
    }));

    vi.doMock("../../../../../lib/services/photos.service", () => ({
      verifyRoomOwnership: verifyRoomOwnershipMock,
      confirmPhotoUpload: confirmPhotoUploadMock,
    }));

    ({ POST } = await import("./index"));
  });

  it("returns 401 when authentication is missing", async () => {
    const context = buildContext();
    context.request.json.mockResolvedValue({
      photoId: "b6f5b6b5-2d4d-4e88-a3da-1a1d0c2fd031",
      storagePath: "users/user-123/rooms/room-1/room/a.jpg",
      photoType: "room",
    });

    const response = await POST(context);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });
});
