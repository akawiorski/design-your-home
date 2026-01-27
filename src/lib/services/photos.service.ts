/* eslint-disable no-console */
import type { SupabaseClient } from "../../db/supabase.client";
import type { PhotoType, RoomPhotoDTO, PhotoCount } from "../../types";
import { ValidationRules } from "../../types";

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
    console.error("photos.service.getPhotoCountByRoomId failed", { roomId, error });
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
    console.error("photos.service.verifyRoomOwnership failed", { roomId, userId, error });
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
    console.error("photos.service.createPendingPhoto failed", { roomId, photoId, photoType, storagePath, error });
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
    console.error("photos.service.confirmPhotoUpload find failed", { payload, error: findError });
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
    console.error("photos.service.confirmPhotoUpload update failed", {
      payload,
      error: updateError ?? null,
    });
    throw new Error(`Failed to update photo metadata: ${updateError?.message || "Unknown error"}`);
  }

  const bucketName = "room-photos";
  const url = await generatePresignedDownloadUrl(supabase, bucketName, updatedPhoto.storage_path);

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
 * @param supabase - Supabase client instance
 * @param bucketName - Storage bucket name
 * @param storagePath - Path where the file will be stored
 * @returns Presigned upload URL
 * @throws Error if URL generation fails
 */
export async function generatePresignedUploadUrl(
  supabase: SupabaseClient,
  bucketName: string,
  storagePath: string
): Promise<string> {
  await ensureBucketExists(supabase, bucketName);
  const { data, error } = await supabase.storage.from(bucketName).createSignedUploadUrl(storagePath, {
    upsert: false,
  });

  if (error) {
    console.error("photos.service.generatePresignedUploadUrl failed", { bucketName, storagePath, error });
    throw new Error(`Failed to generate presigned upload URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    console.error("photos.service.generatePresignedUploadUrl missing signedUrl", { bucketName, storagePath });
    throw new Error("Presigned URL was not generated");
  }

  return data.signedUrl;
}

async function ensureBucketExists(supabase: SupabaseClient, bucketName: string) {
  const { data, error } = await supabase.storage.getBucket(bucketName);

  if (data) {
    return;
  }

  if (error) {
    console.error("photos.service.ensureBucketExists failed", { bucketName, error });
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: `${ValidationRules.MAX_FILE_SIZE_MB}MB`,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/heic"],
  });

  if (createError) {
    console.error("photos.service.ensureBucketExists create failed", { bucketName, error: createError });
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
  supabase: SupabaseClient,
  bucketName: string,
  storagePath: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error("photos.service.generatePresignedDownloadUrl failed", { bucketName, storagePath, error });
    throw new Error(`Failed to generate presigned download URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    console.error("photos.service.generatePresignedDownloadUrl missing signedUrl", { bucketName, storagePath });
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
    console.error("photos.service.getRoomPhotos failed", { roomId, photoType, error });
    throw new Error(`Failed to fetch room photos: ${error.message}`);
  }

  if (!photos || photos.length === 0) {
    return [];
  }

  // Generate signed URLs for all photos
  const bucketName = "room-photos";
  const photoDTOs: RoomPhotoDTO[] = [];

  for (const photo of photos) {
    const url = await generatePresignedDownloadUrl(supabase, bucketName, photo.storage_path);

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
    console.error("photos.service.getPhotoCountsByType failed", { roomId, error });
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
