-- ============================================================================
-- Migration: Add RLS Policy for Room Types Public Read Access
-- Description: Allows public read access to room_types table (dictionary)
-- Author: API Team
-- Date: 2026-01-20
-- ============================================================================

-- Room Types: Allow public read access (dictionary table)
-- This enables the GET /api/room-types endpoint to work without authentication
create policy "Allow public read access to room types"
  on room_types
  for select
  using (true);

comment on policy "Allow public read access to room types" on room_types is 
  'Allows anyone to read room types dictionary. Required for public GET /api/room-types endpoint.';
