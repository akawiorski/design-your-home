import { errorResponse } from "./response.helpers";

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 * @param value - String to validate
 * @returns true if valid UUID
 */
export const isValidUUID = (value: string): boolean => {
  return UUID_REGEX.test(value);
};

/**
 * Validate and extract roomId from params
 * Returns error response if invalid, or roomId if valid
 */
export const validateRoomId = (
  roomId: unknown
): { valid: true; roomId: string } | { valid: false; error: Response } => {
  if (!roomId || typeof roomId !== "string") {
    return {
      valid: false,
      error: errorResponse(400, "VALIDATION_ERROR", "roomId is required in the URL path."),
    };
  }

  if (!isValidUUID(roomId)) {
    return {
      valid: false,
      error: errorResponse(400, "VALIDATION_ERROR", "roomId must be a valid UUID."),
    };
  }

  return { valid: true, roomId };
};

/**
 * Validate user authentication from locals
 * Returns error response if not authenticated, or userId if valid
 */
export const validateAuth = (
  userId: string | undefined
): { valid: true; userId: string } | { valid: false; error: Response } => {
  if (!userId) {
    return {
      valid: false,
      error: errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required to access this resource."),
    };
  }

  return { valid: true, userId };
};
