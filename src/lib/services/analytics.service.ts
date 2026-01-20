import type { SupabaseClient } from "../../db/supabase.client";
import type { AnalyticsEventData } from "../../types";
import type { Json } from "../../db/database.types";

/**
 * Service for managing analytics events
 * Handles business logic and database operations for analytics tracking
 */

/**
 * Track an analytics event
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID who triggered the event
 * @param eventType - Type of event being tracked
 * @param eventData - Event-specific data as JSONB
 * @returns Created event ID
 * @throws Error if database insert fails
 */
export async function trackEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  eventData: AnalyticsEventData
): Promise<string> {
  const { data, error } = await supabase
    .from("analytics_events")
    .insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData as unknown as Json,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to track analytics event: ${error.message}`);
  }

  return data.id;
}

/**
 * Validate event type against supported event types
 *
 * @param eventType - Event type to validate
 * @returns True if event type is supported
 */
export function isSupportedEventType(eventType: string): boolean {
  const supportedTypes = ["InspirationGenerated", "RoomCreated", "PhotoUploaded"];
  return supportedTypes.includes(eventType);
}
