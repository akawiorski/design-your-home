import type { APIContext } from "astro";
import { z } from "zod";

import type { GetUploadUrlCommand } from "../../../../../types";
import { DEFAULT_USER_ID } from "../../../../../db/supabase.client";
import { errorResponse, commonErrors } from "../../../../../lib/api/response.helpers";
import { validateRoomId, validateAuth } from "../../../../../lib/api/validators";
import { GenerateUploadUrlCommand } from "../../../../../lib/commands/generate-upload-url.command";

export const prerender = false;

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

  // Parse and validate request body
  let rawBody: unknown;
  try {
    rawBody = await context.request.json();
  } catch (error) {
    return commonErrors.invalidJson(error instanceof Error ? error : undefined);
  }

  const validationResult = requestBodySchema.safeParse(rawBody);
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return errorResponse(400, "VALIDATION_ERROR", firstError.message, {
      field: firstError.path.join("."),
      issues: validationResult.error.errors,
    });
  }

  // Execute command
  const command = new GenerateUploadUrlCommand(supabase, roomIdValidation.roomId, authValidation.userId);
  return command.execute(validationResult.data);
}
