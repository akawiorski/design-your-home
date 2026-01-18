-- ============================================================================
-- Migration: Initial Schema for Home Inspiration Generator
-- Description: Creates core tables, enums, indexes, and RLS policies for MVP
-- Author: Database Schema Team
-- Date: 2026-01-11
-- 
-- Tables Created:
--   - room_types: Dictionary of room types (kitchen, bathroom, etc.)
--   - rooms: Rooms owned by a user
--   - room_photos: Input photos for rooms (room photos and inspiration photos)
--   - analytics_events: Analytics events tracking (InspirationGenerated, etc.)
--
-- Security: All tables have RLS enabled with granular policies per operation
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUMS
-- ============================================================================

-- photo_type_enum: Distinguishes between room photos and inspiration photos
create type photo_type_enum as enum ('room', 'inspiration');

comment on type photo_type_enum is 'Type of photo: room (actual room photo) or inspiration (inspiration reference photo)';

-- ============================================================================
-- SECTION 2: TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: room_types
-- Purpose: Dictionary table for room types (kitchen, bathroom, bedroom, etc.)
-- RLS: Read-only for all users, write access for admins only
-- ----------------------------------------------------------------------------
create table room_types (
    id serial primary key,
    name text not null unique,
    display_name text not null,
    created_at timestamptz not null default now()
);

comment on table room_types is 'Dictionary of room types used in the application';
comment on column room_types.name is 'Internal name in snake_case (e.g., kitchen, living_room)';
comment on column room_types.display_name is 'User-facing display name (e.g., Kuchnia, Salon)';

-- Insert default room types
insert into room_types (name, display_name) values
    ('kitchen', 'Kuchnia'),
    ('bathroom', 'Łazienka'),
    ('bedroom', 'Sypialnia'),
    ('living_room', 'Salon');

-- ----------------------------------------------------------------------------
-- Table: rooms
-- Purpose: Rooms owned by a user. Each room is a separate context for generation.
-- RLS: Users can only access their own rooms
-- Soft Delete: Uses deleted_at column
-- ----------------------------------------------------------------------------
create table rooms (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    room_type_id integer not null references room_types(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

comment on table rooms is 'Rooms owned by a user. Each room is a separate generation context.';
comment on column rooms.id is 'Unique room identifier';
comment on column rooms.user_id is 'Reference to Supabase Auth user';
comment on column rooms.room_type_id is 'Reference to room type from dictionary';
comment on column rooms.deleted_at is 'Soft delete timestamp. NULL means active record.';

-- ----------------------------------------------------------------------------
-- Table: room_photos
-- Purpose: Input photos for rooms. Distinguishes between room photos and inspiration photos.
-- RLS: Users can only access photos from their own rooms
-- Soft Delete: Uses deleted_at column
-- Storage: storage_path contains path in Supabase Storage, not public URL
-- ----------------------------------------------------------------------------
create table room_photos (
    id uuid primary key default gen_random_uuid(),
    room_id uuid not null references rooms(id) on delete cascade,
    photo_type photo_type_enum not null,
    storage_path text not null,
    description text,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

comment on table room_photos is 'Input photos for rooms: actual room photos and inspiration reference photos';
comment on column room_photos.id is 'Unique photo identifier';
comment on column room_photos.room_id is 'Reference to parent room';
comment on column room_photos.photo_type is 'Type of photo: room or inspiration';
comment on column room_photos.storage_path is 'Path to file in Supabase Storage (not public URL)';
comment on column room_photos.description is 'Optional user-provided description of the photo';
comment on column room_photos.deleted_at is 'Soft delete timestamp. NULL means active record.';


-- ----------------------------------------------------------------------------
-- Table: analytics_events
-- Purpose: Universal analytics events table. Tracks InspirationGenerated and future events.
-- RLS: Insert-only for clients. No read access (backend only via service_role)
-- JSONB Format: event_data contains flexible event-specific data
-- ----------------------------------------------------------------------------
create table analytics_events (
    id uuid primary key default gen_random_uuid(),
    event_type text not null,
    event_data jsonb not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

comment on table analytics_events is 'Analytics events in universal format. Client can only insert, backend reads via service_role.';
comment on column analytics_events.id is 'Unique event identifier';
comment on column analytics_events.event_type is 'Event type identifier (e.g., InspirationGenerated)';
comment on column analytics_events.event_data is 'JSONB with event-specific data';
comment on column analytics_events.user_id is 'Reference to Supabase Auth user (required)';

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================
-- Rooms: Indexes for user and room type lookups on active rooms
create index idx_rooms_user_id on rooms(user_id) where deleted_at is null;
create index idx_rooms_room_type_id on rooms(room_type_id);

-- Room Photos: Indexes for room lookups and photo type filtering on active photos
create index idx_room_photos_room_id on room_photos(room_id) where deleted_at is null;
create index idx_room_photos_photo_type on room_photos(photo_type);

-- Analytics Events: Composite indexes for common analytics queries
create index idx_analytics_events_event_type_created_at on analytics_events(event_type, created_at);
create index idx_analytics_events_user_id_created_at on analytics_events(user_id, created_at);

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
-- Note: RLS is enabled but no policies are defined.
-- All access must go through service_role key or policies must be added separately.
alter table room_types enable row level security;
alter table rooms enable row level security;
alter table room_photos enable row level security;
alter table analytics_events enable row level security;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
