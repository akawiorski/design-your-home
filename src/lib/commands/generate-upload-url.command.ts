import type { SupabaseClient } from "../../db/supabase.client";
import type { GetUploadUrlCommand, GetUploadUrlResponse, PhotoType } from "../../types";
import { ValidationRules } from "../../types";
import {
  verifyRoomOwnership,
  getPhotoCountByRoomId,
  generateStoragePath,
  createPendingPhoto,
  generatePresignedUploadUrl,
} from "../services/photos.service";
import { STORAGE_CONFIG } from "../config/storage.config";
import { errorResponse } from "../api/response.helpers";

/**
 * Command to generate presigned upload URL for photo upload
 * Implements Command Pattern for complex multi-step operation
 *
 * Responsibilities:
 * - Verify room ownership
 * - Check photo count limits
 * - Generate storage path
 * - Create pending photo record
 * - Generate presigned URL
 */
export class GenerateUploadUrlCommand {
  constructor(
    private supabase: SupabaseClient,
    private roomId: string,
    private userId: string
  ) {}

  /**
   * Execute the command
   * @param input - Upload URL generation parameters
   * @returns Upload URL response or error response
   */
  async execute(input: GetUploadUrlCommand): Promise<Response> {
    try {
      // Step 1: Verify room ownership
      const ownershipResult = await this.verifyOwnership();
      if (!ownershipResult.success) {
        return ownershipResult.error;
      }

      // Step 2: Check photo count limit
      const limitResult = await this.checkPhotoLimit();
      if (!limitResult.success) {
        return limitResult.error;
      }

      // Step 3: Generate storage path
      const storagePath = this.generateStoragePath(input);

      // Step 4: Generate photo ID
      const photoId = this.generatePhotoId();

      // Step 5: Create pending photo record
      await this.createPendingRecord(photoId, input.photoType, storagePath);

      // Step 6: Generate presigned upload URL
      const uploadUrl = await this.generateUploadUrl(storagePath);

      // Step 7: Calculate expiration time
      const expiresAt = this.calculateExpiration();

      // Step 8: Return response
      return this.createSuccessResponse(uploadUrl, storagePath, photoId, expiresAt);
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
   * Check if room has reached photo limit
   */
  private async checkPhotoLimit(): Promise<{ success: true } | { success: false; error: Response }> {
    const currentPhotoCount = await getPhotoCountByRoomId(this.supabase, this.roomId);

    if (currentPhotoCount >= ValidationRules.MAX_PHOTOS_PER_ROOM) {
      return {
        success: false,
        error: errorResponse(
          413,
          "PAYLOAD_TOO_LARGE",
          `Room has reached the maximum limit of ${ValidationRules.MAX_PHOTOS_PER_ROOM} photos.`,
          {
            currentCount: currentPhotoCount,
            maxCount: ValidationRules.MAX_PHOTOS_PER_ROOM,
          }
        ),
      };
    }

    return { success: true };
  }

  /**
   * Generate storage path for the photo
   */
  private generateStoragePath(input: GetUploadUrlCommand): string {
    return generateStoragePath(this.userId, this.roomId, input.photoType, input.fileName);
  }

  /**
   * Generate unique photo ID
   */
  private generatePhotoId(): string {
    return crypto.randomUUID();
  }

  /**
   * Create pending photo record in database
   */
  private async createPendingRecord(photoId: string, photoType: PhotoType, storagePath: string): Promise<void> {
    await createPendingPhoto(this.supabase, photoId, this.roomId, photoType, storagePath);
  }

  /**
   * Generate presigned upload URL
   */
  private async generateUploadUrl(storagePath: string): Promise<string> {
    return generatePresignedUploadUrl(this.supabase, STORAGE_CONFIG.BUCKET_NAME, storagePath);
  }

  /**
   * Calculate URL expiration timestamp
   */
  private calculateExpiration(): string {
    return new Date(Date.now() + STORAGE_CONFIG.URL_EXPIRATION_MS).toISOString();
  }

  /**
   * Create success response
   */
  private createSuccessResponse(uploadUrl: string, storagePath: string, photoId: string, expiresAt: string): Response {
    const response: GetUploadUrlResponse = {
      uploadUrl,
      storagePath,
      photoId,
      expiresAt,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Handle errors during execution
   */
  private handleError(error: unknown): Response {
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while generating upload URL.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
