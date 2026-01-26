import type { ErrorResponse } from "../../types";

/**
 * Helper function to create JSON response
 * Standardizes JSON response format across all API endpoints
 */
export const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Helper function to create error response
 * Provides consistent error response structure across all API endpoints
 */
export const errorResponse = (
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response => {
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
 * Common error responses for reuse across endpoints
 */
export const commonErrors = {
  supabaseNotConfigured: () => errorResponse(500, "SUPABASE_NOT_CONFIGURED", "Supabase client is not configured."),

  authenticationRequired: () =>
    errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required to access this resource."),

  roomNotFound: () => errorResponse(404, "NOT_FOUND", "Room not found."),

  forbidden: (message = "User does not own this room.") => errorResponse(403, "FORBIDDEN", message),

  invalidJson: (error?: Error) =>
    errorResponse(400, "INVALID_JSON", "Request body must be valid JSON.", {
      message: error?.message ?? "Invalid JSON",
    }),

  internalError: (message: string, error?: Error) =>
    errorResponse(500, "INTERNAL_ERROR", message, {
      message: error?.message ?? "Unknown error",
    }),
};
