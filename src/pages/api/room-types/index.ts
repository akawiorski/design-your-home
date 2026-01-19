import type { APIContext } from "astro";

import type { ErrorResponse, RoomTypesListResponse } from "../../../types";
import { getAllRoomTypes } from "../../../lib/services/room-types.service";

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
 * GET /api/room-types
 *
 * List all available room types (dictionary).
 *
 * Authentication: Not required (public)
 *
 * Response:
 * - 200 OK: Returns list of room types
 * - 500 Internal Server Error: Server error
 *
 * @param context - Astro API context
 * @returns Response with list of room types
 */
export async function GET(context: APIContext) {
  const { locals } = context;

  try {
    // Fetch room types using service layer
    const roomTypes = await getAllRoomTypes(locals.supabase);

    // Prepare response
    const response: RoomTypesListResponse = {
      roomTypes,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    // Return generic error response
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while fetching room types.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
