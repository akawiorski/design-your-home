import type { SupabaseClient } from "../../db/supabase.client";
import type { RoomTypeDTO } from "../../types";
import logger from "../logger";

/**
 * Service for managing room types
 * Handles business logic and database operations for room types dictionary
 */

/**
 * Get all available room types
 *
 * @param supabase - Supabase client instance
 * @returns Array of room type DTOs
 * @throws Error if database query fails
 */
export async function getAllRoomTypes(supabase: SupabaseClient): Promise<RoomTypeDTO[]> {
  const { data: roomTypes, error } = await supabase
    .from("room_types")
    .select("id, name, display_name")
    .order("id", { ascending: true });

  if (error) {
    logger.error({ err: error }, "room-types.service.getAllRoomTypes failed");
    throw new Error(`Failed to fetch room types: ${error.message}`);
  }

  if (!roomTypes || roomTypes.length === 0) {
    return [];
  }

  // Transform to DTOs
  const roomTypeDTOs: RoomTypeDTO[] = roomTypes.map((roomType) => ({
    id: roomType.id,
    name: roomType.name,
    displayName: roomType.display_name,
  }));

  return roomTypeDTOs;
}
