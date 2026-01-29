import type { APIContext } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RoomPhotoDTO } from "../../../../../types";

const listRoomPhotosExecuteMock = vi.fn();
const confirmPhotoUploadExecuteMock = vi.fn();

// Mock Command classes
vi.mock("../../../../../lib/commands/list-room-photos.command", () => ({
  ListRoomPhotosCommand: vi.fn().mockImplementation(() => ({
    execute: listRoomPhotosExecuteMock,
  })),
}));

vi.mock("../../../../../lib/commands/confirm-photo-upload.command", () => ({
  ConfirmPhotoUploadCommand: vi.fn().mockImplementation(() => ({
    execute: confirmPhotoUploadExecuteMock,
  })),
}));

const buildContext = (overrides: Partial<APIContext> = {}): APIContext =>
  ({
    locals: {
      supabase: {} as SupabaseClient,
      supabaseAdmin: {} as SupabaseClient,
      user: { id: "user-123" },
    },
    params: {
      roomId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    },
    request: {
      json: vi.fn(),
    },
    ...overrides,
  }) as APIContext;

describe("POST /api/rooms/{roomId}/photos", () => {
  let POST: (context: APIContext) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();

    listRoomPhotosExecuteMock.mockReset();
    confirmPhotoUploadExecuteMock.mockReset();

    ({ POST } = await import("./index"));
  });

  it("returns 400 when roomId param is invalid", async () => {
    const response = await POST(buildContext({ params: { roomId: "not-a-uuid" } }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when body is invalid", async () => {
    const context = buildContext();
    context.request.json.mockResolvedValue({ photoId: "bad" });

    const response = await POST(context);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when command returns not found", async () => {
    const context = buildContext();
    context.request.json.mockResolvedValue({
      photoId: "b6f5b6b5-2d4d-4e88-a3da-1a1d0c2fd031",
      storagePath: "users/user-123/rooms/room-1/room/a.jpg",
      photoType: "room",
    });

    confirmPhotoUploadExecuteMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "NOT_FOUND" } }), { status: 404 })
    );

    const response = await POST(context);

    expect(response.status).toBe(404);
  });

  it("returns 201 with created photo", async () => {
    const context = buildContext();
    context.request.json.mockResolvedValue({
      photoId: "b6f5b6b5-2d4d-4e88-a3da-1a1d0c2fd031",
      storagePath: "users/user-123/rooms/room-1/room/a.jpg",
      photoType: "room",
      description: "Kitchen view",
    });

    const responsePhoto: RoomPhotoDTO = {
      id: "b6f5b6b5-2d4d-4e88-a3da-1a1d0c2fd031",
      roomId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
      photoType: "room",
      storagePath: "users/user-123/rooms/room-1/room/a.jpg",
      description: "Kitchen view",
      url: "https://example.com/a.jpg",
      createdAt: "2026-01-11T10:00:00Z",
    };

    confirmPhotoUploadExecuteMock.mockResolvedValue(new Response(JSON.stringify(responsePhoto), { status: 201 }));

    const response = await POST(context);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe(responsePhoto.id);
    expect(body.url).toBe(responsePhoto.url);
  });
});

describe("POST /api/rooms/{roomId}/photos - unauthenticated", () => {
  let POST: (context: APIContext) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();

    listRoomPhotosExecuteMock.mockReset();
    confirmPhotoUploadExecuteMock.mockReset();

    ({ POST } = await import("./index"));
  });

  it("returns 401 when authentication is missing", async () => {
    const context = buildContext({
      locals: { supabase: {} as SupabaseClient, supabaseAdmin: {} as SupabaseClient, user: null },
    });
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
