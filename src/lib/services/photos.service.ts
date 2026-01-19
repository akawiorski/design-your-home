import type { SupabaseClient } from "../../db/supabase.client";
import type { PhotoType } from "../../types";

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
    throw new Error(`Failed to create pending photo: ${error.message}`);
  }

  return data.id;
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
  const { data, error } = await supabase.storage.from(bucketName).createSignedUploadUrl(storagePath, {
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to generate presigned upload URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error("Presigned URL was not generated");
  }

  return data.signedUrl;
}
