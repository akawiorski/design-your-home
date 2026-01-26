/**
 * Storage configuration
 * Centralizes all storage-related constants
 */
export const STORAGE_CONFIG = {
  /**
   * Supabase Storage bucket name for room photos
   */
  BUCKET_NAME: "room-photos",

  /**
   * Presigned URL expiration time in seconds (1 hour)
   */
  URL_EXPIRATION_SECONDS: 3600,

  /**
   * Presigned URL expiration time in milliseconds (1 hour)
   */
  URL_EXPIRATION_MS: 3600 * 1000,
} as const;
