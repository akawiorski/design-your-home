import type { APIContext } from "astro";

import type { ErrorResponse, RoomsListResponse } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { getRoomsByUserId } from "../../../lib/services/rooms.service";

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
    const rooms = await getRoomsByUserId(locals.supabase, userId);

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
