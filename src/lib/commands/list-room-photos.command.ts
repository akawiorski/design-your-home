import type { SupabaseClient } from "../../db/supabase.client";
import type { RoomPhotosListResponse, PhotoType } from "../../types";
import { isPhotoType } from "../../types";
import { verifyRoomOwnership, getRoomPhotos, getPhotoCountsByType } from "../services/photos.service";
import { errorResponse, jsonResponse } from "../api/response.helpers";

/**
 * Command to list photos for a room
 * Implements Command Pattern for photo listing operation
 *
 * Responsibilities:
 * - Verify room ownership
 * - Fetch photos with optional filtering
 * - Get photo counts by type
 */
export class ListRoomPhotosCommand {
  constructor(
    private supabase: SupabaseClient,
    private roomId: string,
    private userId: string,
    private photoType?: string
  ) {}

  /**
   * Execute the command
   * @returns Response with photos and counts or error response
   */
  async execute(): Promise<Response> {
    try {
      // Validate photoType if provided
      const validatedPhotoType = this.validatePhotoType();
      if ("error" in validatedPhotoType) {
        return validatedPhotoType.error;
      }

      // Verify room ownership
      const ownershipResult = await this.verifyOwnership();
      if (!ownershipResult.success) {
        return ownershipResult.error;
      }

      // Fetch photos and counts in parallel
      const [photos, counts] = await Promise.all([
        getRoomPhotos(this.supabase, this.roomId, validatedPhotoType.photoType),
        getPhotoCountsByType(this.supabase, this.roomId),
      ]);

      // Prepare response
      const response: RoomPhotosListResponse = {
        photos,
        counts,
      };

      return jsonResponse(response, 200);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validate photoType query parameter
   */
  private validatePhotoType(): { photoType?: PhotoType } | { error: Response } {
    if (!this.photoType) {
      return { photoType: undefined };
    }

    if (!isPhotoType(this.photoType)) {
      return {
        error: errorResponse(400, "VALIDATION_ERROR", "photoType must be 'room' or 'inspiration'.", {
          providedValue: this.photoType,
          allowedValues: ["room", "inspiration"],
        }),
      };
    }

    return { photoType: this.photoType };
  }

  /**
   * Verify that the user owns the room
   */
  private async verifyOwnership(): Promise<{ success: true } | { success: false; error: Response }> {
    const isOwner = await verifyRoomOwnership(this.supabase, this.roomId, this.userId);

    if (!isOwner) {
      return {
        success: false,
        error: errorResponse(404, "NOT_FOUND", "Room not found."),
      };
    }

    return { success: true };
  }

  /**
   * Handle errors during execution
   */
  private handleError(error: unknown): Response {
    if (import.meta.env.DEV) {
      console.error("[ListRoomPhotosCommand] Error:", error);
    }

    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while fetching photos.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
