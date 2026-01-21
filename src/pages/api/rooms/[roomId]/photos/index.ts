import type { APIContext } from "astro";
import { z } from "zod";

import type {
  ErrorResponse,
  RoomPhotosListResponse,
  PhotoType,
  CreateRoomPhotoCommand,
  RoomPhotoDTO,
} from "../../../../../types";
import { isPhotoType, ValidationRules } from "../../../../../types";
import { DEFAULT_USER_ID } from "../../../../../db/supabase.client";
import {
  verifyRoomOwnership,
  getRoomPhotos,
  getPhotoCountsByType,
  confirmPhotoUpload,
} from "../../../../../lib/services/photos.service";

export const prerender = false;

/**
 * Helper function to create JSON response
 */
const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Helper function to create error response
 */
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

/**
 * GET /api/rooms/{roomId}/photos
 *
 * List photos for a specific room with optional filtering by photo type.
 *
 * Authentication: Required (authenticated user, must own room)
 *
 * Path Parameters:
 * - roomId: uuid (required) - Room identifier
 *
 * Query Parameters:
 * - photoType: 'room' | 'inspiration' (optional) - Filter by photo type
 *
 * Response:
 * - 200 OK: Photos retrieved successfully
 * - 400 Bad Request: Invalid photoType query parameter
 * - 401 Unauthorized: No valid authentication token
 * - 403 Forbidden: User does not own this room
 * - 404 Not Found: Room not found
 * - 500 Internal Server Error: Server error
 *
 * Response Body:
 * - photos: Array of photo DTOs with signed URLs
 * - counts: Photo counts by type (room, inspiration, total)
 *
 * @param context - Astro API context
 * @returns Response with list of photos and counts
 */
export async function GET(context: APIContext) {
  const { locals, params, url } = context;
  const supabase = locals.supabaseAdmin ?? locals.supabase;

  if (!supabase) {
    return errorResponse(500, "SUPABASE_NOT_CONFIGURED", "Supabase client is not configured.");
  }

  // Extract roomId from path parameters
  const { roomId } = params;

  // Validate roomId is provided
  if (!roomId) {
    return errorResponse(400, "VALIDATION_ERROR", "roomId is required in the URL path.");
  }

  // Validate roomId is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(roomId)) {
    return errorResponse(400, "VALIDATION_ERROR", "roomId must be a valid UUID.");
  }

  const userId = locals.session?.user?.id ?? DEFAULT_USER_ID;

  // Validate authentication
  if (!userId) {
    return errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required to access this resource.");
  }

  // Extract and validate query parameters
  const photoTypeParam = url.searchParams.get("photoType");
  let photoType: PhotoType | undefined;

  if (photoTypeParam) {
    if (!isPhotoType(photoTypeParam)) {
      return errorResponse(400, "VALIDATION_ERROR", "photoType must be 'room' or 'inspiration'.", {
        providedValue: photoTypeParam,
        allowedValues: ["room", "inspiration"],
      });
    }
    photoType = photoTypeParam;
  }

  try {
    // Step 1: Verify room ownership
    const isOwner = await verifyRoomOwnership(supabase, roomId, userId);

    if (!isOwner) {
      // Room either doesn't exist or user doesn't own it
      // Return 404 for security (don't reveal if room exists)
      return errorResponse(404, "NOT_FOUND", "Room not found.");
    }

    // Step 2: Fetch photos with optional filtering
    const photos = await getRoomPhotos(supabase, roomId, photoType);

    // Step 3: Get photo counts by type
    const counts = await getPhotoCountsByType(supabase, roomId);

    // Step 4: Prepare response
    const response: RoomPhotosListResponse = {
      photos,
      counts,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    // TODO: Implement proper logging service

    // Return generic error response
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while fetching photos.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const paramsSchema = z.object({
  roomId: z.string().uuid(),
});

const bodySchema = z.object({
  photoId: z.string().uuid(),
  storagePath: z.string().min(1, "storagePath is required"),
  photoType: z.enum(["room", "inspiration"], {
    errorMap: () => ({ message: "photoType must be 'room' or 'inspiration'" }),
  }),
  description: z.string().max(ValidationRules.PHOTO_DESCRIPTION_MAX_LENGTH).optional(),
});

/**
 * POST /api/rooms/{roomId}/photos
 *
 * Create a photo record after successful upload to storage.
 *
 * Authentication: Required (authenticated user, must own room)
 */
export async function POST(context: APIContext) {
  const { locals, params, request } = context;
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

  // TODO: Get user ID from authenticated session (Supabase Auth)
  // For MVP, using DEFAULT_USER_ID as a placeholder
  // This will be replaced with: const userId = locals.session?.user?.id;
  const userId = locals.session?.user?.id ?? DEFAULT_USER_ID;

  if (!userId) {
    return errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required to access this resource.");
  }

  let body: CreateRoomPhotoCommand;
  try {
    body = await request.json();
  } catch (error) {
    return errorResponse(400, "INVALID_JSON", "Request body must be valid JSON.", {
      message: error instanceof Error ? error.message : "Invalid JSON",
    });
  }

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Request body validation failed.", {
      issues: parsedBody.error.issues,
    });
  }

  const payload = parsedBody.data;

  try {
    const isOwner = await verifyRoomOwnership(supabase, roomId, userId);

    if (!isOwner) {
      return errorResponse(404, "NOT_FOUND", "Room not found.");
    }

    const confirmedPhoto = await confirmPhotoUpload(supabase, {
      photoId: payload.photoId,
      roomId,
      photoType: payload.photoType,
      storagePath: payload.storagePath,
      description: payload.description,
    });

    if (!confirmedPhoto) {
      return errorResponse(404, "NOT_FOUND", "Photo not found.", {
        photoId: payload.photoId,
      });
    }

    const response: RoomPhotoDTO = confirmedPhoto;

    return jsonResponse(response, 201);
  } catch (error) {
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while creating photo.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
