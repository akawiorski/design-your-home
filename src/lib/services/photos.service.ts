import type { SupabaseClient } from "@supabase/supabase-js";
import type { PhotoType, RoomPhotoDTO, PhotoCount } from "../../types";
import { ValidationRules } from "../../types";
import logger from "../logger";

/**
 * Service for managing room photos
 * Handles business logic and database operations for photos
 */

/**
 * Get the count of photos for a specific room
 *
 * @param supabase - Supabase client instance
 * @param roomId - Room ID to count photos for
 * @returns Total number of photos (room + inspiration)
 * @throws Error if database query fails
 */
export async function getPhotoCountByRoomId(supabase: SupabaseClient, roomId: string): Promise<number> {
  const { count, error } = await supabase
    .from("room_photos")
    .select("*", { count: "exact", head: true })
    .eq("room_id", roomId)
    .is("deleted_at", null);

  if (error) {
    logger.error({ roomId, err: error }, "photos.service.getPhotoCountByRoomId failed");
    throw new Error(`Failed to fetch photo count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Check if a room exists and belongs to a specific user
 *
 * @param supabase - Supabase client instance
 * @param roomId - Room ID to check
 * @param userId - User ID to verify ownership
 * @returns True if room exists and belongs to user, false otherwise
 * @throws Error if database query fails
 */
export async function verifyRoomOwnership(supabase: SupabaseClient, roomId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    logger.error({ roomId, userId, err: error }, "photos.service.verifyRoomOwnership failed");
    throw new Error(`Failed to verify room ownership: ${error.message}`);
  }

  return data !== null;
}

/**
 * Generate a unique storage path for a photo
 *
 * @param userId - User ID who owns the photo
 * @param roomId - Room ID the photo belongs to
 * @param photoType - Type of photo (room or inspiration)
 * @param fileName - Original file name
 * @returns Unique storage path
 */
export function generateStoragePath(userId: string, roomId: string, photoType: PhotoType, fileName: string): string {
  // Extract file extension
  const extension = fileName.split(".").pop() || "jpg";

  // Generate timestamp for uniqueness
  const timestamp = Date.now();

  // Generate unique filename
  const uniqueFileName = `${timestamp}-${crypto.randomUUID()}.${extension}`;

  // Build path: users/{userId}/rooms/{roomId}/{photoType}/{uniqueFileName}
  return `users/${userId}/rooms/${roomId}/${photoType}/${uniqueFileName}`;
}

/**
 * Create a photo record in the database (pending upload)
 *
 * @param supabase - Supabase client instance
 * @param photoId - Pre-generated photo ID
 * @param roomId - Room ID the photo belongs to
 * @param photoType - Type of photo (room or inspiration)
 * @param storagePath - Storage path where the photo will be uploaded
 * @returns Created photo ID
 * @throws Error if database insert fails
 */
export async function createPendingPhoto(
  supabase: SupabaseClient,
  photoId: string,
  roomId: string,
  photoType: PhotoType,
  storagePath: string
): Promise<string> {
  const { data, error } = await supabase
    .from("room_photos")
    .insert({
      id: photoId,
      room_id: roomId,
      photo_type: photoType,
      storage_path: storagePath,
      description: null,
    })
    .select("id")
    .single();

  if (error) {
    logger.error({ roomId, photoId, photoType, storagePath, err: error }, "photos.service.createPendingPhoto failed");
    throw new Error(`Failed to create pending photo: ${error.message}`);
  }

  return data.id;
}

/**
 * Confirm a pending photo record after successful upload.
 *
 * Ensures the photoId, roomId, storagePath and photoType match the pending record.
 * Optionally updates description and returns a DTO with signed URL.
 */
export async function confirmPhotoUpload(
  supabase: SupabaseClient,
  supabaseAdmin: SupabaseClient,
  payload: {
    photoId: string;
    roomId: string;
    photoType: PhotoType;
    storagePath: string;
    description?: string;
  }
): Promise<RoomPhotoDTO | null> {
  const { data: pendingPhoto, error: findError } = await supabase
    .from("room_photos")
    .select("id, room_id, photo_type, storage_path, description, created_at")
    .eq("id", payload.photoId)
    .eq("room_id", payload.roomId)
    .eq("photo_type", payload.photoType)
    .eq("storage_path", payload.storagePath)
    .is("deleted_at", null)
    .maybeSingle();

  if (findError) {
    logger.error({ payload, err: findError }, "photos.service.confirmPhotoUpload find failed");
    throw new Error(`Failed to confirm photo: ${findError.message}`);
  }

  if (!pendingPhoto) {
    return null;
  }

  const nextDescription = payload.description ?? pendingPhoto.description;
  const { data: updatedPhoto, error: updateError } = await supabase
    .from("room_photos")
    .update({ description: nextDescription })
    .eq("id", payload.photoId)
    .select("id, room_id, photo_type, storage_path, description, created_at")
    .single();

  if (updateError || !updatedPhoto) {
    logger.error(
      {
        payload,
        err: updateError ?? null,
      },
      "photos.service.confirmPhotoUpload update failed"
    );
    throw new Error(`Failed to update photo metadata: ${updateError?.message || "Unknown error"}`);
  }

  const bucketName = "room-photos";
  const url = await generatePresignedDownloadUrl(supabaseAdmin, bucketName, updatedPhoto.storage_path);

  return {
    id: updatedPhoto.id,
    roomId: updatedPhoto.room_id,
    photoType: updatedPhoto.photo_type as PhotoType,
    storagePath: updatedPhoto.storage_path,
    description: updatedPhoto.description,
    url,
    createdAt: updatedPhoto.created_at,
  };
}

/**
 * Generate a presigned upload URL for Supabase Storage
 *
 * @param supabaseAdmin - Supabase client instance
 * @param bucketName - Storage bucket name
 * @param storagePath - Path where the file will be stored
 * @returns Presigned upload URL
 * @throws Error if URL generation fails
 */
export async function generatePresignedUploadUrl(
  supabaseAdmin: SupabaseClient,
  bucketName: string,
  storagePath: string
): Promise<string> {
  await ensureBucketExists(supabaseAdmin, bucketName);
  const { data, error } = await supabaseAdmin.storage.from(bucketName).createSignedUploadUrl(storagePath, {
    upsert: false,
  });

  if (error) {
    logger.error({ bucketName, storagePath, err: error }, "photos.service.generatePresignedUploadUrl failed");
    throw new Error(`Failed to generate presigned upload URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    logger.error({ bucketName, storagePath }, "photos.service.generatePresignedUploadUrl missing signedUrl");
    throw new Error("Presigned URL was not generated");
  }

  return data.signedUrl;
}

async function ensureBucketExists(supabaseAdmin: SupabaseClient, bucketName: string) {
  const { data, error } = await supabaseAdmin.storage.getBucket(bucketName);

  if (data) {
    return;
  }

  if (error) {
    logger.error({ bucketName, err: error }, "photos.service.ensureBucketExists failed");
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: `${ValidationRules.MAX_FILE_SIZE_MB}MB`,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/heic"],
  });

  if (createError) {
    logger.error({ bucketName, err: createError }, "photos.service.ensureBucketExists create failed");
    throw new Error(`Storage bucket '${bucketName}' is not available.`);
  }
}

/**
 * Generate a presigned download URL for Supabase Storage
 *
 * @param supabase - Supabase client instance
 * @param bucketName - Storage bucket name
 * @param storagePath - Path to the file in storage
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Presigned download URL
 * @throws Error if URL generation fails
 */
export async function generatePresignedDownloadUrl(
  supabaseAdmin: SupabaseClient,
  bucketName: string,
  storagePath: string,
  expiresIn = 3600
): Promise<string> {
  logger.info({ bucketName, storagePath }, "Generating presigned download URL");

  const { data, error } = await supabaseAdmin.storage.from(bucketName).createSignedUrl(storagePath, expiresIn);

  if (error) {
    logger.error({ bucketName, storagePath, err: error }, "photos.service.generatePresignedDownloadUrl failed");
    throw new Error(`Failed to generate presigned download URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    logger.error({ bucketName, storagePath }, "photos.service.generatePresignedDownloadUrl missing signedUrl");
    throw new Error("Presigned download URL was not generated");
  }

  return data.signedUrl;
}

/**
 * Get photos for a specific room with optional filtering by photo type
 *
 * @param supabase - Supabase client instance
 * @param roomId - Room ID to fetch photos for
 * @param photoType - Optional filter by photo type
 * @returns Array of room photo DTOs with signed URLs
 * @throws Error if database query fails
 */
export async function getRoomPhotos(
  supabase: SupabaseClient,
  supabaseAdmin: SupabaseClient,
  roomId: string,
  photoType?: PhotoType
): Promise<RoomPhotoDTO[]> {
  // Build query
  let query = supabase
    .from("room_photos")
    .select("id, room_id, photo_type, storage_path, description, created_at")
    .eq("room_id", roomId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Apply photo type filter if provided
  if (photoType) {
    query = query.eq("photo_type", photoType);
  }

  const { data: photos, error } = await query;

  if (error) {
    logger.error({ roomId, photoType, err: error }, "photos.service.getRoomPhotos failed");
    throw new Error(`Failed to fetch room photos: ${error.message}`);
  }

  if (!photos || photos.length === 0) {
    return [];
  }

  // Generate signed URLs for all photos
  const bucketName = "room-photos";
  const photoDTOs: RoomPhotoDTO[] = [];

  for (const photo of photos) {
    const url = await generatePresignedDownloadUrl(supabaseAdmin, bucketName, photo.storage_path);

    photoDTOs.push({
      id: photo.id,
      roomId: photo.room_id,
      photoType: photo.photo_type as PhotoType,
      storagePath: photo.storage_path,
      description: photo.description,
      url,
      createdAt: photo.created_at,
    });
  }

  return photoDTOs;
}

/**
 * Get photo counts by type for a specific room
 *
 * @param supabase - Supabase client instance
 * @param roomId - Room ID to count photos for
 * @returns Photo counts by type (room, inspiration, total)
 * @throws Error if database query fails
 */
export async function getPhotoCountsByType(
  supabase: SupabaseClient,
  roomId: string
): Promise<PhotoCount & { total: number }> {
  const { data: photos, error } = await supabase
    .from("room_photos")
    .select("photo_type")
    .eq("room_id", roomId)
    .is("deleted_at", null);

  if (error) {
    logger.error({ roomId, err: error }, "photos.service.getPhotoCountsByType failed");
    throw new Error(`Failed to fetch photo counts: ${error.message}`);
  }

  const counts = {
    room: 0,
    inspiration: 0,
    total: 0,
  };

  if (photos) {
    for (const photo of photos) {
      if (photo.photo_type === "room") {
        counts.room++;
      } else if (photo.photo_type === "inspiration") {
        counts.inspiration++;
      }
      counts.total++;
    }
  }

  return counts;
}
