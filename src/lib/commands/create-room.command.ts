import type { SupabaseClient } from "../../db/supabase.client";
import type { RoomDTO } from "../../types";
import { createRoom } from "../services/rooms.service";
import { errorResponse, jsonResponse } from "../api/response.helpers";

/**
 * Command to create a new room
 * Implements Command Pattern for room creation operation
 *
 * Responsibilities:
 * - Create room in database
 * - Handle room type validation errors
 * - Handle permission errors
 */
export class CreateRoomCommand {
  constructor(
    private supabase: SupabaseClient,
    private userId: string,
    private roomTypeId: number
  ) {}

  /**
   * Execute the command
   * @returns Response with created room or error response
   */
  async execute(): Promise<Response> {
    try {
      const room: RoomDTO = await createRoom(this.supabase, this.userId, this.roomTypeId);
      return jsonResponse(room, 201);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle errors during execution with specific error type mapping
   */
  private handleError(error: unknown): Response {
    if (import.meta.env.DEV) {
      console.error("[CreateRoomCommand] Error:", error);
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Room type not found
    if (errorMessage.includes("not found")) {
      return errorResponse(404, "NOT_FOUND", `Room type with id ${this.roomTypeId} not found.`, {
        roomTypeId: this.roomTypeId,
      });
    }

    // Permission error
    if (errorMessage.toLowerCase().includes("row-level security")) {
      return errorResponse(403, "FORBIDDEN", "Insufficient permissions to create room.", {
        message: errorMessage,
      });
    }

    // Generic error
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while creating room.", {
      message: errorMessage,
    });
  }
}
