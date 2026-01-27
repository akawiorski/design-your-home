/* eslint-disable no-console */
import type { SupabaseClient } from "../../db/supabase.client";
import type { GenerateSimpleInspirationResponse } from "../../types";
import { getRoomWithTypeById } from "../services/rooms.service";
import { createAIServiceForSimpleAdvice, mapAIErrorToResponse } from "../factories/ai-service.factory";
import { errorResponse, jsonResponse } from "../api/response.helpers";

/**
 * Command to generate simple advice using AI
 * Implements Command Pattern for simple AI advice generation
 *
 * Responsibilities:
 * - Verify room ownership
 * - Generate simple advice using AI service
 * - Handle AI-specific errors
 */
export class GenerateSimpleAdviceCommand {
  private requestId: string;

  constructor(
    private supabase: SupabaseClient,
    private roomId: string,
    private userId: string,
    private description: string
  ) {
    this.requestId = crypto.randomUUID();
  }

  /**
   * Execute the command
   * @returns Response with generated advice or error response
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

      this.logRequest();

      // Step 2: Create AI service and generate advice
      const aiService = createAIServiceForSimpleAdvice();

      const result = await aiService.generateSimpleAdvice({
        roomId: this.roomId,
        roomType: room.roomType.displayName,
        description: this.description,
      });

      const response: GenerateSimpleInspirationResponse = {
        roomId: this.roomId,
        advice: result.advice,
        image: result.image,
      };

      return jsonResponse(response, 200);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Log request details
   */
  private logRequest(): void {
    console.info("generate.simple.request", {
      roomId: this.roomId,
      userId: this.userId,
      descriptionLength: this.description.length,
      requestId: this.requestId,
    });
  }

  /**
   * Handle errors during execution
   */
  private handleError(error: unknown): Response {
    console.error("generate.simple failed", {
      requestId: this.requestId,
      roomId: this.roomId,
      userId: this.userId,
      error: error instanceof Error ? error.message : String(error),
    });

    return mapAIErrorToResponse(error, this.requestId);
  }
}
