import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateRoomPhotoCommand, RoomPhotoDTO } from "../../types";
import { verifyRoomOwnership, confirmPhotoUpload } from "../services/photos.service";
import { errorResponse, jsonResponse } from "../api/response.helpers";

/**
 * Command to confirm photo upload
 * Implements Command Pattern for photo confirmation operation
 *
 * Responsibilities:
 * - Verify room ownership
 * - Confirm photo upload in database
 * - Return photo DTO
 */
export class ConfirmPhotoUploadCommand {
  constructor(
    private supabase: SupabaseClient,
    private supabaseAdmin: SupabaseClient,
    private roomId: string,
    private userId: string,
    private payload: CreateRoomPhotoCommand
  ) {}

  /**
   * Execute the command
   * @returns Response with confirmed photo or error response
   */
  async execute(): Promise<Response> {
    try {
      // Verify room ownership
      const ownershipResult = await this.verifyOwnership();
      if (!ownershipResult.success) {
        return ownershipResult.error;
      }

      // Confirm photo upload
      const confirmedPhoto = await confirmPhotoUpload(this.supabase, this.supabaseAdmin, {
        photoId: this.payload.photoId,
        roomId: this.roomId,
        photoType: this.payload.photoType,
        storagePath: this.payload.storagePath,
        description: this.payload.description,
      });

      if (!confirmedPhoto) {
        return errorResponse(404, "NOT_FOUND", "Photo not found.", {
          photoId: this.payload.photoId,
        });
      }

      const response: RoomPhotoDTO = confirmedPhoto;
      return jsonResponse(response, 201);
    } catch (error) {
      return this.handleError(error);
    }
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
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while creating photo.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
