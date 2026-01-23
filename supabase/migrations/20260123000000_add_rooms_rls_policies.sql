-- ============================================================================
-- Migration: Add RLS Policies for Rooms and Room Photos
-- Description: Adds policies to ensure users can only access their own rooms
-- Author: Security Team
-- Date: 2026-01-23
-- ============================================================================

-- ============================================================================
-- ROOMS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view only their own rooms (non-deleted)
create policy "Users can view own rooms"
  on rooms
  for select
  using (
    auth.uid() = user_id 
    and deleted_at is null
  );

comment on policy "Users can view own rooms" on rooms is 
  'Users can only SELECT their own non-deleted rooms';

-- Policy: Users can insert their own rooms
create policy "Users can create own rooms"
  on rooms
  for insert
  with check (
    auth.uid() = user_id
  );

comment on policy "Users can create own rooms" on rooms is 
  'Users can only INSERT rooms with their own user_id';

-- Policy: Users can update only their own rooms
create policy "Users can update own rooms"
  on rooms
  for update
  using (
    auth.uid() = user_id
  )
  with check (
    auth.uid() = user_id
  );

comment on policy "Users can update own rooms" on rooms is 
  'Users can only UPDATE their own rooms and cannot change ownership';

-- Policy: Users can soft-delete only their own rooms
create policy "Users can delete own rooms"
  on rooms
  for delete
  using (
    auth.uid() = user_id
  );

comment on policy "Users can delete own rooms" on rooms is 
  'Users can only DELETE their own rooms';

-- ============================================================================
-- ROOM_PHOTOS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view photos from their own rooms (non-deleted)
create policy "Users can view photos from own rooms"
  on room_photos
  for select
  using (
    exists (
      select 1 
      from rooms 
      where rooms.id = room_photos.room_id 
        and rooms.user_id = auth.uid()
        and rooms.deleted_at is null
    )
    and room_photos.deleted_at is null
  );

comment on policy "Users can view photos from own rooms" on room_photos is 
  'Users can only SELECT photos from their own non-deleted rooms';

-- Policy: Users can insert photos to their own rooms
create policy "Users can add photos to own rooms"
  on room_photos
  for insert
  with check (
    exists (
      select 1 
      from rooms 
      where rooms.id = room_photos.room_id 
        and rooms.user_id = auth.uid()
        and rooms.deleted_at is null
    )
  );

comment on policy "Users can add photos to own rooms" on room_photos is 
  'Users can only INSERT photos to their own non-deleted rooms';

-- Policy: Users can update photos in their own rooms
create policy "Users can update photos in own rooms"
  on room_photos
  for update
  using (
    exists (
      select 1 
      from rooms 
      where rooms.id = room_photos.room_id 
        and rooms.user_id = auth.uid()
        and rooms.deleted_at is null
    )
  )
  with check (
    exists (
      select 1 
      from rooms 
      where rooms.id = room_photos.room_id 
        and rooms.user_id = auth.uid()
        and rooms.deleted_at is null
    )
  );

comment on policy "Users can update photos in own rooms" on room_photos is 
  'Users can only UPDATE photos in their own non-deleted rooms';

-- Policy: Users can soft-delete photos from their own rooms
create policy "Users can delete photos from own rooms"
  on room_photos
  for delete
  using (
    exists (
      select 1 
      from rooms 
      where rooms.id = room_photos.room_id 
        and rooms.user_id = auth.uid()
        and rooms.deleted_at is null
    )
  );

comment on policy "Users can delete photos from own rooms" on room_photos is 
  'Users can only DELETE photos from their own non-deleted rooms';

-- ============================================================================
-- ANALYTICS_EVENTS TABLE POLICIES
-- ============================================================================

-- Policy: Users can insert their own analytics events
create policy "Users can create own analytics events"
  on analytics_events
  for insert
  with check (
    auth.uid() = user_id
  );

comment on policy "Users can create own analytics events" on analytics_events is 
  'Users can only INSERT analytics events with their own user_id';

-- Note: No SELECT, UPDATE, or DELETE policies for analytics_events
-- Analytics data is insert-only from client side
-- Backend reads via service_role key for reporting

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
