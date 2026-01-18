import type { SupabaseClient } from "../../db/supabase.client";
import type { RoomDTO, RoomTypeDTO, PhotoCount } from "../../types";

/**
 * Service for managing rooms
 * Handles business logic and database operations for rooms
 */

/**
 * Get all rooms for a specific user
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to fetch rooms for
 * @returns Array of room DTOs with room type and photo counts
 * @throws Error if database query fails
 */
export async function getRoomsByUserId(supabase: SupabaseClient, userId: string): Promise<RoomDTO[]> {
  // Query rooms with room type joined
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select(
      `
      id,
      room_type_id,
      created_at,
      updated_at,
      room_types (
        id,
        name,
        display_name
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (roomsError) {
    throw new Error(`Failed to fetch rooms: ${roomsError.message}`);
  }

  if (!rooms || rooms.length === 0) {
    return [];
  }

  // Get photo counts for all rooms in a single query
  const roomIds = rooms.map((room) => room.id);
  const { data: photoCounts, error: photoCountsError } = await supabase
    .from("room_photos")
    .select("room_id, photo_type")
    .in("room_id", roomIds);

  if (photoCountsError) {
    throw new Error(`Failed to fetch photo counts: ${photoCountsError.message}`);
  }

  // Aggregate photo counts by room_id and photo_type
  const photoCountsMap = new Map<string, PhotoCount>();

  for (const room of rooms) {
    photoCountsMap.set(room.id, { room: 0, inspiration: 0 });
  }

  if (photoCounts) {
    for (const photo of photoCounts) {
      const counts = photoCountsMap.get(photo.room_id);
      if (counts) {
        if (photo.photo_type === "room") {
          counts.room++;
        } else if (photo.photo_type === "inspiration") {
          counts.inspiration++;
        }
      }
    }
  }

  // Transform to DTOs
  const roomDTOs: RoomDTO[] = rooms.map((room) => {
    // Handle room_types join (can be null or object)
    const roomTypeData = Array.isArray(room.room_types) ? room.room_types[0] : room.room_types;

    if (!roomTypeData) {
      throw new Error(`Room type not found for room ${room.id}`);
    }

    const roomType: RoomTypeDTO = {
      id: roomTypeData.id,
      name: roomTypeData.name,
      displayName: roomTypeData.display_name,
    };

    const photoCount = photoCountsMap.get(room.id) || { room: 0, inspiration: 0 };

    return {
      id: room.id,
      roomType,
      photoCount,
      createdAt: room.created_at,
      updatedAt: room.updated_at,
    };
  });

  return roomDTOs;
}
