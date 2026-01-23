import type { APIContext } from "astro";
import { z } from "zod";

import type { ErrorResponse, TrackAnalyticsEventCommand, TrackAnalyticsEventResponse } from "../../../types";
import { trackEvent, isSupportedEventType } from "../../../lib/services/analytics.service";

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
 * Zod schema for request body validation
 */
const requestBodySchema = z.object({
  eventType: z.string().min(1, "eventType is required").max(100, "eventType must not exceed 100 characters"),
  eventData: z.record(z.unknown()).refine((data) => Object.keys(data).length > 0, {
    message: "eventData must contain at least one property",
  }),
});

/**
 * POST /api/analytics/events
 *
 * Track an analytics event for the authenticated user.
 *
 * This endpoint allows tracking various user actions and system events
 * for analytics and monitoring purposes. All event data is stored as JSONB
 * in the database for flexible schema-less storage.
 *
 * Authentication: Required (authenticated user)
 *
 * Request Body:
 * - eventType: string (required) - Type of event (e.g., "InspirationGenerated", "RoomCreated", "PhotoUploaded")
 * - eventData: object (required) - Event-specific data as key-value pairs
 *
 * Response:
 * - 201 Created: Event tracked successfully
 * - 400 Bad Request: Invalid event data or validation error
 * - 401 Unauthorized: No valid authentication token
 * - 500 Internal Server Error: Server error
 *
 * Supported Event Types:
 * - InspirationGenerated: When inspiration is generated for a room
 * - RoomCreated: When a new room is created
 * - PhotoUploaded: When a photo is uploaded to a room
 *
 * Example Request Body:
 * ```json
 * {
 *   "eventType": "InspirationGenerated",
 *   "eventData": {
 *     "roomId": "uuid",
 *     "roomType": "kitchen",
 *     "generationDuration": 4500
 *   }
 * }
 * ```
 *
 * @param context - Astro API context
 * @returns Response with success message and event ID
 */
export async function POST(context: APIContext) {
  const { locals } = context;

  // Get user ID from authenticated session
  const userId = locals.user?.id;

  // Validate authentication
  if (!userId) {
    return errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required to access this resource.");
  }

  try {
    // Parse and validate request body
    const rawBody = await context.request.json();
    const validationResult = requestBodySchema.safeParse(rawBody);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return errorResponse(400, "VALIDATION_ERROR", firstError.message, {
        field: firstError.path.join("."),
        issues: validationResult.error.errors,
      });
    }

    const body: TrackAnalyticsEventCommand = validationResult.data;

    // Optional: Validate against known event types (informational only)
    // Note: We don't enforce this strictly to allow flexibility for new event types
    if (!isSupportedEventType(body.eventType)) {
      // Log warning but continue processing
      // TODO: Implement proper logging service
      // console.warn(`Unknown event type: ${body.eventType}`);
    }

    // Step 1: Track event in database
    const eventId = await trackEvent(locals.supabase, userId, body.eventType, body.eventData);

    // Step 2: Prepare response
    const response: TrackAnalyticsEventResponse = {
      message: "Event tracked successfully",
      eventId,
    };

    return jsonResponse(response, 201);
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    // TODO: Implement proper logging service

    // Return generic error response
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while tracking the event.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
