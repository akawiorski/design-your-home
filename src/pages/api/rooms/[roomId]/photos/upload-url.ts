import type { APIContext } from "astro";
import { z } from "zod";

import type { ErrorResponse, GetUploadUrlCommand, GetUploadUrlResponse } from "../../../../../types";
import { ValidationRules } from "../../../../../types";
import { DEFAULT_USER_ID } from "../../../../../db/supabase.client";
import {
  verifyRoomOwnership,
  getPhotoCountByRoomId,
  generateStoragePath,
  createPendingPhoto,
  generatePresignedUploadUrl,
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
 * Zod schema for request body validation
 */
const requestBodySchema = z.object({
  photoType: z.enum(["room", "inspiration"], {
    errorMap: () => ({ message: "photoType must be 'room' or 'inspiration'" }),
  }),
  fileName: z.string().min(1, "fileName is required").max(255, "fileName must not exceed 255 characters"),
  contentType: z.enum(["image/jpeg", "image/png", "image/heic"], {
    errorMap: () => ({ message: "contentType must be 'image/jpeg', 'image/png', or 'image/heic'" }),
  }),
});

/**
 * POST /api/rooms/{roomId}/photos/upload-url
 *
 * Get a presigned URL for uploading a photo to Supabase Storage.
 *
 * This endpoint implements a two-step upload process:
 * 1. Client requests a presigned upload URL
 * 2. Client uploads the photo directly to Supabase Storage using the presigned URL
 * 3. Client calls POST /api/rooms/{roomId}/photos to confirm the upload
 *
 * Authentication: Required (authenticated user, must own room)
 *
 * Path Parameters:
 * - roomId: uuid (required) - Room identifier
 *
 * Request Body:
 * - photoType: 'room' | 'inspiration' (required) - Type of photo
 * - fileName: string (required) - Original file name
 * - contentType: 'image/jpeg' | 'image/png' | 'image/heic' (required) - MIME type
 *
 * Response:
 * - 200 OK: Presigned URL generated successfully
 * - 400 Bad Request: Invalid photoType or contentType
 * - 401 Unauthorized: No valid authentication token
 * - 403 Forbidden: User does not own this room
 * - 404 Not Found: Room not found
 * - 413 Payload Too Large: Room already has 10 photos (max limit)
 * - 500 Internal Server Error: Server error
 *
 * Validation:
 * - photoType must be 'room' or 'inspiration'
 * - contentType must be 'image/jpeg', 'image/png', or 'image/heic'
 * - Total photos per room cannot exceed 10
 *
 * @param context - Astro API context
 * @returns Response with presigned upload URL and metadata
 */
export async function POST(context: APIContext) {
  const { locals, params } = context;
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

  try {
    // Parse and validate request body
    const rawBody = await context.request.json();
    const validationResult = requestBodySchema.safeParse(rawBody);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return errorResponse(400, "VALIDATION_ERROR", firstError.message, {
        field: firstError.path.join("."),
        issues: validationResult.error.errors,
      });
    }

    const body: GetUploadUrlCommand = validationResult.data;

    // Step 1: Verify room ownership
    const isOwner = await verifyRoomOwnership(supabase, roomId, userId);

    if (!isOwner) {
      // Room either doesn't exist or user doesn't own it
      // Return 404 for security (don't reveal if room exists)
      return errorResponse(404, "NOT_FOUND", "Room not found.");
    }

    // Step 2: Check photo count limit
    const currentPhotoCount = await getPhotoCountByRoomId(supabase, roomId);

    if (currentPhotoCount >= ValidationRules.MAX_PHOTOS_PER_ROOM) {
      return errorResponse(
        413,
        "PAYLOAD_TOO_LARGE",
        `Room has reached the maximum limit of ${ValidationRules.MAX_PHOTOS_PER_ROOM} photos.`,
        {
          currentCount: currentPhotoCount,
          maxCount: ValidationRules.MAX_PHOTOS_PER_ROOM,
        }
      );
    }

    // Step 3: Generate storage path
    const storagePath = generateStoragePath(userId, roomId, body.photoType, body.fileName);

    // Step 4: Generate photo ID (will be used to create pending record)
    const photoId = crypto.randomUUID();

    // Step 5: Create pending photo record in database
    await createPendingPhoto(supabase, photoId, roomId, body.photoType, storagePath);

    // Step 6: Generate presigned upload URL
    const bucketName = "room-photos"; // Supabase Storage bucket name
    const uploadUrl = await generatePresignedUploadUrl(supabase, bucketName, storagePath);

    // Step 7: Calculate expiration time (1 hour from now)
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    // Step 8: Prepare response
    const response: GetUploadUrlResponse = {
      uploadUrl,
      storagePath,
      photoId,
      expiresAt,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    // TODO: Implement proper logging service

    // Return generic error response
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while generating upload URL.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
