import type { APIContext } from "astro";
import { z } from "zod";

import type { CreateRoomPhotoCommand } from "../../../../../types";
import { ValidationRules } from "../../../../../types";
import { errorResponse, commonErrors } from "../../../../../lib/api/response.helpers";
import { validateRoomId, validateAuth } from "../../../../../lib/api/validators";
import { ListRoomPhotosCommand } from "../../../../../lib/commands/list-room-photos.command";
import { ConfirmPhotoUploadCommand } from "../../../../../lib/commands/confirm-photo-upload.command";

export const prerender = false;

const bodySchema = z.object({
  photoId: z.string().uuid(),
  storagePath: z.string().min(1, "storagePath is required"),
  photoType: z.enum(["room", "inspiration"], {
    errorMap: () => ({ message: "photoType must be 'room' or 'inspiration'" }),
  }),
  description: z.string().max(ValidationRules.PHOTO_DESCRIPTION_MAX_LENGTH).optional(),
});

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

  // Validate Supabase client
  if (!supabase) {
    return commonErrors.supabaseNotConfigured();
  }

  // Validate roomId
  const roomIdValidation = validateRoomId(params.roomId);
  if (!roomIdValidation.valid) {
    return roomIdValidation.error;
  }

  // Validate authentication
  const authValidation = validateAuth(locals.session?.user?.id ?? DEFAULT_USER_ID);
  if (!authValidation.valid) {
    return authValidation.error;
  }

  // Extract optional photoType query parameter
  const photoTypeParam = url.searchParams.get("photoType");

  // Execute command
  const command = new ListRoomPhotosCommand(
    supabase,
    roomIdValidation.roomId,
    authValidation.userId,
    photoTypeParam ?? undefined
  );

  return command.execute();
}

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

  // Validate Supabase client
  if (!supabase) {
    return commonErrors.supabaseNotConfigured();
  }

  // Validate roomId
  const roomIdValidation = validateRoomId(params.roomId);
  if (!roomIdValidation.valid) {
    return roomIdValidation.error;
  }

  // Validate authentication
  const authValidation = validateAuth(locals.user?.id);
  if (!authValidation.valid) {
    return authValidation.error;
  }

  // Parse and validate request body
  let body: CreateRoomPhotoCommand;
  try {
    body = await request.json();
  } catch (error) {
    return commonErrors.invalidJson(error instanceof Error ? error : undefined);
  }

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Request body validation failed.", {
      issues: parsedBody.error.issues,
    });
  }

  // Execute command
  const command = new ConfirmPhotoUploadCommand(
    supabase,
    roomIdValidation.roomId,
    authValidation.userId,
    parsedBody.data
  );

  return command.execute();
}
