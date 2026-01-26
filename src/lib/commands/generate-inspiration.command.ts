import type { SupabaseClient } from "../../db/supabase.client";
import type { GenerateInspirationCommand, GeneratedInspirationDTO } from "../../types";
import { ValidationRules } from "../../types";
import { getRoomWithTypeById } from "../services/rooms.service";
import { getRoomPhotos } from "../services/photos.service";
import { AIServiceFactory, mapAIErrorToResponse } from "../factories/ai-service.factory";
import { errorResponse, jsonResponse } from "../api/response.helpers";

/**
 * Command to generate room inspiration using AI
 * Implements Command Pattern for complex AI generation operation
 *
 * Responsibilities:
 * - Verify room ownership
 * - Validate photo requirements
 * - Generate inspiration using AI service
 * - Handle AI-specific errors
 */
export class GenerateInspirationCommand {
  private requestId: string;

  constructor(
    private supabase: SupabaseClient,
    private roomId: string,
    private userId: string,
    private prompt?: string
  ) {
    this.requestId = crypto.randomUUID();
  }

  /**
   * Execute the command
   * @returns Response with generated inspiration or error response
   */
  async execute(): Promise<Response> {
    try {
      // Step 1: Get room and verify ownership
      const room = await getRoomWithTypeById(this.supabase, this.roomId);

      if (!room) {
        return errorResponse(404, "NOT_FOUND", "Room not found.");
      }

      if (room.userId !== this.userId) {
        return errorResponse(403, "FORBIDDEN", "User does not own this room.");
      }

      // Step 2: Get photos and validate requirements
      const photos = await getRoomPhotos(this.supabase, this.roomId);
      const roomPhotos = photos.filter((photo) => photo.photoType === "room");
      const inspirationPhotos = photos.filter((photo) => photo.photoType === "inspiration");

      this.logRequest(roomPhotos.length, inspirationPhotos.length);

      const validationError = this.validatePhotoRequirements(roomPhotos.length, inspirationPhotos.length);
      if (validationError) {
        return validationError;
      }

      // Step 3: Create AI service and generate inspiration
      const aiService = AIServiceFactory.createForInspiration();

      const result = await aiService.generateRoomInspiration({
        roomId: this.roomId,
        roomType: room.roomType.displayName,
        prompt: this.prompt,
        roomPhoto: {
          url: roomPhotos[0].url,
          description: roomPhotos[0].description,
        },
        inspirationPhotos: inspirationPhotos.map((photo) => ({
          url: photo.url,
          description: photo.description,
        })),
      });

      const response: GeneratedInspirationDTO = {
        roomId: this.roomId,
        bulletPoints: result.bulletPoints,
        images: result.images,
      };

      return jsonResponse(response, 200);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validate photo requirements
   */
  private validatePhotoRequirements(roomCount: number, inspirationCount: number): Response | null {
    if (roomCount < ValidationRules.MIN_ROOM_PHOTOS) {
      return errorResponse(400, "VALIDATION_ERROR", "At least one room photo is required.", {
        current: roomCount,
        required: ValidationRules.MIN_ROOM_PHOTOS,
      });
    }

    if (inspirationCount < ValidationRules.MIN_INSPIRATION_PHOTOS) {
      return errorResponse(400, "VALIDATION_ERROR", "At least two inspiration photos are required.", {
        current: inspirationCount,
        required: ValidationRules.MIN_INSPIRATION_PHOTOS,
      });
    }

    return null;
  }

  /**
   * Log request details
   */
  private logRequest(roomPhotosCount: number, inspirationPhotosCount: number): void {
    console.info("generate.inspiration.request", {
      roomId: this.roomId,
      userId: this.userId,
      promptLength: this.prompt?.length ?? 0,
      roomPhotosCount,
      inspirationPhotosCount,
      requestId: this.requestId,
    });
  }

  /**
   * Handle errors during execution
   */
  private handleError(error: unknown): Response {
    console.error("generate.inspiration failed", {
      requestId: this.requestId,
      roomId: this.roomId,
      userId: this.userId,
      error: error instanceof Error ? error.message : String(error),
    });

    return mapAIErrorToResponse(error, this.requestId);
  }
}
