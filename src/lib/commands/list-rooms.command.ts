import type { SupabaseClient } from "../../db/supabase.client";
import type { RoomsListResponse } from "../../types";
import { getRoomsByUserId } from "../services/rooms.service";
import { errorResponse, jsonResponse } from "../api/response.helpers";

/**
 * Command to list rooms for a user
 * Implements Command Pattern for room listing operation
 *
 * Responsibilities:
 * - Fetch all rooms for authenticated user
 * - Return rooms with room types and photo counts
 */
export class ListRoomsCommand {
  constructor(
    private supabase: SupabaseClient,
    private userId: string
  ) {}

  /**
   * Execute the command
   * @returns Response with rooms list or error response
   */
  async execute(): Promise<Response> {
    try {
      const rooms = await getRoomsByUserId(this.supabase, this.userId);

      const response: RoomsListResponse = {
        rooms,
      };

      return jsonResponse(response, 200);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle errors during execution
   */
  private handleError(error: unknown): Response {
    if (import.meta.env.DEV) {
      console.error("[ListRoomsCommand] Error:", error);
    }

    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while fetching rooms.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
