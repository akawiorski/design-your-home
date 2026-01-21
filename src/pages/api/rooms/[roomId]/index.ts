import type { APIContext } from "astro";
import { z } from "zod";

import type { ErrorResponse, RoomWithPhotosDTO } from "../../../../types";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { getRoomWithTypeById } from "../../../../lib/services/rooms.service";
import { getPhotoCountsByType, getRoomPhotos } from "../../../../lib/services/photos.service";

export const prerender = false;

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const errorResponse = (status: number, code: string, message: string, details?: Record<string, unknown>) => {
  const body: ErrorResponse = {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };

  return jsonResponse(body, status);
};

const paramsSchema = z.object({
  roomId: z.string().uuid(),
});

/**
 * GET /api/rooms/{roomId}
 *
 * Get details of a specific room.
 *
 * Authentication: Required (authenticated user, must own room)
 *
 * Response:
 * - 200 OK: Room retrieved
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: User does not own this room
 * - 404 Not Found: Room not found
 * - 500 Internal Server Error: Server error
 */
export async function GET(context: APIContext) {
  const { locals, params } = context;
  const supabase = locals.supabaseAdmin ?? locals.supabase;

  if (!supabase) {
    return errorResponse(500, "SUPABASE_NOT_CONFIGURED", "Supabase client is not configured.");
  }

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return errorResponse(400, "INVALID_PARAMS", "Invalid roomId path parameter.", {
      issues: parsedParams.error.issues,
    });
  }

  const { roomId } = parsedParams.data;

  const userId = locals.session?.user?.id ?? DEFAULT_USER_ID;

  if (!userId) {
    return errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required to access this resource.");
  }

  try {
    const room = await getRoomWithTypeById(supabase, roomId);

    if (!room) {
      return errorResponse(404, "NOT_FOUND", "Room not found.");
    }

    if (room.userId !== userId) {
      return errorResponse(403, "FORBIDDEN", "User does not own this room.");
    }

    const [photos, counts] = await Promise.all([
      getRoomPhotos(supabase, roomId),
      getPhotoCountsByType(supabase, roomId),
    ]);

    const response: RoomWithPhotosDTO = {
      id: room.id,
      roomType: room.roomType,
      photoCount: {
        room: counts.room,
        inspiration: counts.inspiration,
      },
      photos,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while fetching room.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
