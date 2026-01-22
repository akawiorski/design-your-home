/**
 * Shared types for backend and frontend
 * DTOs (Data Transfer Objects) and Command Models for API operations
 *
 * These types are derived from database entities (database.types.ts) and represent
 * the contract between API endpoints and clients.
 */

import type { Tables, Enums } from "./db/database.types";

// =============================================================================
// Database Entity Types (Re-exported for convenience)
// =============================================================================

export type RoomTypeEntity = Tables<"room_types">;
export type RoomEntity = Tables<"rooms">;
export type RoomPhotoEntity = Tables<"room_photos">;
export type AnalyticsEventEntity = Tables<"analytics_events">;

export type PhotoType = Enums<"photo_type_enum">;

// =============================================================================
// Common Types
// =============================================================================

/**
 * Standard error response structure for API errors
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

/**
 * Standard success message response
 */
export interface SuccessMessageResponse {
  message: string;
}

/**
 * Pagination cursor response
 */
export interface PaginationResponse {
  nextCursor: string | null;
  hasMore: boolean;
}

// =============================================================================
// Room Types - GET /api/room-types
// =============================================================================

/**
 * Room Type DTO - represents dictionary entry for room types
 * Derived from: RoomTypeEntity
 */
export interface RoomTypeDTO {
  id: number;
  name: string;
  displayName: string;
}

/**
 * Response for GET /api/room-types
 */
export interface RoomTypesListResponse {
  roomTypes: RoomTypeDTO[];
}

// =============================================================================
// Rooms - /api/rooms
// =============================================================================

/**
 * Photo count aggregation for a room
 */
export interface PhotoCount {
  room: number;
  inspiration: number;
}

/**
 * Room DTO - represents a room owned by the user
 * Derived from: RoomEntity with joined RoomTypeEntity and photo counts
 */
export interface RoomDTO {
  id: string;
  roomType: RoomTypeDTO;
  photoCount: PhotoCount;
  createdAt: string;
  updatedAt: string;
}

/**
 * Room DTO with photos - extended version for detailed view
 * Used in: GET /api/rooms/{roomId}
 */
export interface RoomWithPhotosDTO extends RoomDTO {
  photos: RoomPhotoDTO[];
}

/**
 * Response for GET /api/rooms
 */
export interface RoomsListResponse {
  rooms: RoomDTO[];
}

/**
 * Command Model for POST /api/rooms
 */
export interface CreateRoomCommand {
  roomTypeId: number;
}

// =============================================================================
// Room Photos - /api/rooms/{roomId}/photos
// =============================================================================

/**
 * Room Photo DTO - represents uploaded photo for a room
 * Derived from: RoomPhotoEntity with public URL
 */
export interface RoomPhotoDTO {
  id: string;
  roomId: string;
  photoType: PhotoType;
  storagePath: string;
  description: string | null;
  url: string;
  createdAt: string;
}

/**
 * Command Model for POST /api/rooms/{roomId}/photos/upload-url
 */
export interface GetUploadUrlCommand {
  photoType: PhotoType;
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/heic";
}

/**
 * Response for POST /api/rooms/{roomId}/photos/upload-url
 */
export interface GetUploadUrlResponse {
  uploadUrl: string;
  storagePath: string;
  photoId: string;
  expiresAt: string;
}

/**
 * Command Model for POST /api/rooms/{roomId}/photos
 */
export interface CreateRoomPhotoCommand {
  photoId: string;
  storagePath: string;
  photoType: PhotoType;
  description?: string;
}

/**
 * Response for GET /api/rooms/{roomId}/photos
 */
export interface RoomPhotosListResponse {
  photos: RoomPhotoDTO[];
  counts: PhotoCount & { total: number };
}

// =============================================================================
// Inspirations Generation - /api/rooms/{roomId}/generate
// =============================================================================

/**
 * Generated image DTO (not persisted in DB)
 */
export interface GeneratedImageDTO {
  storagePath: string;
  position: 1 | 2;
  url: string;
}

/**
 * Generated inspiration DTO (not persisted in DB)
 */
export interface GeneratedInspirationDTO {
  roomId: string;
  bulletPoints: string[];
  images: GeneratedImageDTO[];
}

/**
 * Generated simple inspiration response (text-only)
 */
export interface GenerateSimpleInspirationResponse {
  roomId: string;
  advice: string;
}

/**
 * Command Model for POST /api/rooms/{roomId}/generate
 */
export interface GenerateInspirationCommand {
  prompt?: string;
}

/**
 * Command Model for POST /api/rooms/{roomId}/generate-simple
 */
export interface GenerateSimpleInspirationCommand {
  description: string;
}

/**
 * Input model for OpenRouter generation service
 */
export interface GenerateRoomInspirationInput {
  roomId: string;
  roomType: string;
  prompt?: string;
  roomPhoto: {
    url: string;
    description?: string | null;
  };
  inspirationPhotos: {
    url: string;
    description?: string | null;
  }[];
}

/**
 * Input model for OpenRouter simple text advice
 */
export interface GenerateSimpleInspirationInput {
  roomId: string;
  roomType: string;
  description: string;
}

/**
 * Expected OpenRouter JSON response payload
 */
export interface OpenRouterResponseSchema {
  bulletPoints: string[];
  images: {
    url: string;
    position: 1 | 2;
  }[];
}

/**
 * Room summary for inspiration details
 */
export interface RoomSummary {
  id: string;
  roomType: RoomTypeDTO;
}

// =============================================================================
// Analytics - POST /api/analytics/events
// =============================================================================

/**
 * Base structure for analytics event data
 */
export type BaseAnalyticsEventData = Record<string, unknown>;

/**
 * Event data for InspirationGenerated event
 */
export interface InspirationGeneratedEventData extends BaseAnalyticsEventData {
  roomId: string;
  roomType: string;
  generationDuration: number;
}

/**
 * Event data for RoomCreated event
 */
export interface RoomCreatedEventData extends BaseAnalyticsEventData {
  roomId: string;
  roomType: string;
}

/**
 * Event data for PhotoUploaded event
 */
export interface PhotoUploadedEventData extends BaseAnalyticsEventData {
  photoId: string;
  roomId: string;
  photoType: PhotoType;
}

/**
 * Union of all supported analytics event data types
 */
export type AnalyticsEventData =
  | InspirationGeneratedEventData
  | RoomCreatedEventData
  | PhotoUploadedEventData
  | BaseAnalyticsEventData;

/**
 * Command Model for POST /api/analytics/events
 */
export interface TrackAnalyticsEventCommand {
  eventType: string;
  eventData: AnalyticsEventData;
}

/**
 * Response for POST /api/analytics/events
 */
export interface TrackAnalyticsEventResponse {
  message: string;
  eventId: string;
}

// =============================================================================
// Query Parameters Types
// =============================================================================

/**
 * Query parameters for GET /api/rooms
 */
export interface GetRoomsQueryParams {
  includeDeleted?: boolean;
}

/**
 * Query parameters for GET /api/rooms/{roomId}/photos
 */
export interface GetRoomPhotosQueryParams {
  photoType?: PhotoType;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if a value is a valid PhotoType
 */
export function isPhotoType(value: unknown): value is PhotoType {
  return value === "room" || value === "inspiration";
}

/**
 * Type guard to check if a value is a valid content type for photos
 */
export function isValidPhotoContentType(value: unknown): value is "image/jpeg" | "image/png" | "image/heic" {
  return value === "image/jpeg" || value === "image/png" || value === "image/heic";
}

// =============================================================================
// Validation Constants
// =============================================================================

/**
 * Validation rules constants
 */
export const ValidationRules = {
  PHOTO_DESCRIPTION_MAX_LENGTH: 500,
  INSPIRATION_PROMPT_MAX_LENGTH: 200,
  MAX_PHOTOS_PER_ROOM: 10,
  MIN_ROOM_PHOTOS: 1,
  MIN_INSPIRATION_PHOTOS: 2,
  MAX_FILE_SIZE_MB: 10,
  IMAGES_PER_INSPIRATION: 2,
  GENERATED_IMAGE_WIDTH: 1080,
  GENERATED_IMAGE_HEIGHT: 720,
} as const;

/**
 * Rate limit constants
 */
export const RateLimits = {
  GENERATE_INSPIRATIONS_PER_HOUR: 20,
  UPLOAD_PHOTOS_PER_HOUR: 30,
  GENERAL_API_PER_HOUR: 300,
} as const;
