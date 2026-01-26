import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/db/database.types";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set");
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Database helper for E2E test setup and teardown
 */
export class DatabaseHelper {
  /**
   * Delete all rooms for a specific user
   */
  static async deleteAllRoomsForUser(userId: string) {
    const { error } = await supabase.from("rooms").delete().eq("user_id", userId);

    if (error) {
      console.error("Failed to delete rooms:", error);
      throw error;
    }
  }

  /**
   * Create a test room for a user
   */
  static async createRoomForUser(userId: string, roomTypeId: number) {
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        user_id: userId,
        room_type_id: roomTypeId,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create room:", error);
      throw error;
    }

    return data;
  }

  /**
   * Get all room types
   */
  static async getRoomTypes() {
    const { data, error } = await supabase.from("room_types").select("*");

    if (error) {
      console.error("Failed to get room types:", error);
      throw error;
    }

    return data;
  }

  /**
   * Delete all photos for a specific room
   */
  static async deleteAllPhotosForRoom(roomId: string) {
    const { error } = await supabase.from("room_photos").delete().eq("room_id", roomId);

    if (error) {
      console.error("Failed to delete photos:", error);
      throw error;
    }
  }

  /**
   * Get room with photos by room ID
   */
  static async getRoomById(roomId: string) {
    const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).single();

    if (error) {
      console.error("Failed to get room:", error);
      throw error;
    }

    return data;
  }

  /**
   * Get all photos for a specific room
   */
  static async getPhotosForRoom(roomId: string) {
    const { data, error } = await supabase
      .from("room_photos")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to get photos:", error);
      throw error;
    }

    return data;
  }
}
