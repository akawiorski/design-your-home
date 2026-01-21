import type { APIContext } from "astro";
import { z } from "zod";

import type { ErrorResponse, RoomsListResponse, CreateRoomCommand, RoomDTO } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { getRoomsByUserId, createRoom } from "../../../lib/services/rooms.service";

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
  const supabase = locals.supabaseAdmin ?? locals.supabase;

  if (!supabase) {
    return errorResponse(500, "SUPABASE_NOT_CONFIGURED", "Supabase client is not configured.");
  }

  // TODO: Get user ID from authenticated session (Supabase Auth)
  // For MVP, using DEFAULT_USER_ID as a placeholder
  // This will be replaced with: const userId = locals.session?.user?.id;
  const userId = DEFAULT_USER_ID;

  // Validate authentication
  if (!userId) {
    return errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required to access this resource.");
  }

  try {
    // Fetch rooms using service layer
    const rooms = await getRoomsByUserId(supabase, userId);

    // Prepare response
    const response: RoomsListResponse = {
      rooms,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    // Return generic error response
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while fetching rooms.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
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
  const supabase = locals.supabaseAdmin ?? locals.supabase;

  if (!supabase) {
    return errorResponse(500, "SUPABASE_NOT_CONFIGURED", "Supabase client is not configured.");
  }

  // TODO: Get user ID from authenticated session (Supabase Auth)
  // For MVP, using DEFAULT_USER_ID as a placeholder
  // This will be replaced with: const userId = locals.session?.user?.id;
  const userId = DEFAULT_USER_ID;

  // Validate authentication
  if (!userId) {
    return errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required to access this resource.");
  }

  // Parse and validate request body
  let body: CreateRoomCommand;
  try {
    body = await request.json();
  } catch (error) {
    return errorResponse(400, "INVALID_JSON", "Request body must be valid JSON.", {
      message: error instanceof Error ? error.message : "Invalid JSON",
    });
  }

  const validationResult = bodySchema.safeParse(body);
  if (!validationResult.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Request body validation failed.", {
      issues: validationResult.error.issues,
    });
  }

  const { roomTypeId } = validationResult.data;

  try {
    // Create room using service layer
    const room: RoomDTO = await createRoom(supabase, userId, roomTypeId);

    return jsonResponse(room, 201);
  } catch (error) {
    // Check if error is about room type not found
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("not found")) {
      return errorResponse(404, "NOT_FOUND", `Room type with id ${roomTypeId} not found.`, {
        roomTypeId,
      });
    }

    if (errorMessage.toLowerCase().includes("row-level security")) {
      return errorResponse(403, "FORBIDDEN", "Insufficient permissions to create room.", {
        message: errorMessage,
      });
    }

    // Return generic error response
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while creating room.", {
      message: errorMessage,
    });
  }
}
