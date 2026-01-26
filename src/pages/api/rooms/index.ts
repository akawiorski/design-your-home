import type { APIContext } from "astro";
import { z } from "zod";

import type { CreateRoomCommand as CreateRoomCommandType } from "../../../types";
import { errorResponse, commonErrors } from "../../../lib/api/response.helpers";
import { validateAuth } from "../../../lib/api/validators";
import { ListRoomsCommand } from "../../../lib/commands/list-rooms.command";
import { CreateRoomCommand } from "../../../lib/commands/create-room.command";

export const prerender = false;

const bodySchema = z.object({
  roomTypeId: z.number().int().positive(),
});

/**
 * GET /api/rooms
 *
 * List all rooms owned by the authenticated user.
 *
 * Authentication: Required (authenticated user)
 *
 * Response:
 * - 200 OK: Returns list of rooms with room type and photo counts
 * - 401 Unauthorized: No valid authentication token
 * - 500 Internal Server Error: Server error
 *
 * @param context - Astro API context
 * @returns Response with list of rooms
 */
export async function GET(context: APIContext) {
  const { locals } = context;
  const supabase = locals.supabase;

  // Validate Supabase client
  if (!supabase) {
    return commonErrors.supabaseNotConfigured();
  }

  // Validate authentication
  const authValidation = validateAuth(locals.user?.id);
  if (!authValidation.valid) {
    return authValidation.error;
  }

  // Execute command
  const command = new ListRoomsCommand(supabase, authValidation.userId);
  return command.execute();
}

/**
 * POST /api/rooms
 *
 * Create a new room for the authenticated user.
 *
 * Authentication: Required (authenticated user)
 *
 * Request Body:
 * - roomTypeId: number (required) - ID of the room type
 *
 * Response:
 * - 201 Created: Room created successfully
 * - 400 Bad Request: Invalid roomTypeId or validation error
 * - 401 Unauthorized: No valid authentication token
 * - 404 Not Found: Room type not found
 * - 500 Internal Server Error: Server error
 *
 * @param context - Astro API context
 * @returns Response with created room
 */
export async function POST(context: APIContext) {
  const { locals, request } = context;
  const supabase = locals.supabase;

  if (!supabase) {
    return errorResponse(500, "SUPABASE_NOT_CONFIGURED", "Supabase client is not configured.");
  }

  // Get user ID from authenticated session
  const userId = locals.user?.id;

  // Validate authentication
  if (!userId) {
    return errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required to access this resource.");
  }

  // Validate Supabase client
  if (!supabase) {
    return commonErrors.supabaseNotConfigured();
  }

  // Validate authentication
  const authValidation = validateAuth(locals.user?.id);
  if (!authValidation.valid) {
    return authValidation.error;
  }

  // Parse and validate request body
  let body: CreateRoomCommandType;
  try {
    body = await request.json();
  } catch (error) {
    return commonErrors.invalidJson(error instanceof Error ? error : undefined);
  }

  const validationResult = bodySchema.safeParse(body);
  if (!validationResult.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Request body validation failed.", {
      issues: validationResult.error.issues,
    });
  }

  // Execute command
  const command = new CreateRoomCommand(supabase, authValidation.userId, validationResult.data.roomTypeId);
  return command.execute();
}
