-- ============================================================================
-- Migration: Initial Schema for Home Inspiration Generator
-- Description: Creates core tables, enums, indexes, and RLS policies for MVP
-- Author: Database Schema Team
-- Date: 2026-01-11
-- 
-- Tables Created:
--   - projects: User apartment projects (1 default per user in MVP)
--   - room_types: Dictionary of room types (kitchen, bathroom, etc.)
--   - rooms: Rooms within projects
--   - room_photos: Input photos for rooms (room photos and inspiration photos)
--   - generated_inspirations: Generated inspiration variants with suggestions
--   - inspiration_images: Generated images for each inspiration (2 per variant)
--   - saved_inspirations: User-saved inspiration cards (requires account)
--   - analytics_events: Analytics events tracking (InspirationSaved, etc.)
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
-- Table: projects
-- Purpose: Stores user apartment projects. In MVP, each user has one default project.
-- RLS: Users can only access their own projects
-- Soft Delete: Uses deleted_at column
-- ----------------------------------------------------------------------------
create table projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null default 'My Home',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

comment on table projects is 'User apartment projects. Each user has one default project in MVP.';
comment on column projects.id is 'Unique project identifier';
comment on column projects.user_id is 'Reference to Supabase Auth user';
comment on column projects.name is 'Project name, defaults to "My Home"';
comment on column projects.deleted_at is 'Soft delete timestamp. NULL means active record.';

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
-- Purpose: Rooms within a project. Each room is a separate context for generation.
-- RLS: Users can only access rooms from their own projects
-- Soft Delete: Uses deleted_at column
-- ----------------------------------------------------------------------------
create table rooms (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    room_type_id integer not null references room_types(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

comment on table rooms is 'Rooms within user projects. Each room is a separate generation context.';
comment on column rooms.id is 'Unique room identifier';
comment on column rooms.project_id is 'Reference to parent project';
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
-- Table: generated_inspirations
-- Purpose: Generated inspiration variants for rooms. Each variant contains bullet points with suggestions.
-- RLS: Users can only access inspirations from their own rooms
-- Soft Delete: Uses deleted_at column
-- JSONB Format: bullet_points is an array of strings
-- ----------------------------------------------------------------------------
create table generated_inspirations (
    id uuid primary key default gen_random_uuid(),
    room_id uuid not null references rooms(id) on delete cascade,
    bullet_points jsonb not null,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

comment on table generated_inspirations is 'Generated inspiration variants with functional suggestions';
comment on column generated_inspirations.id is 'Unique inspiration identifier';
comment on column generated_inspirations.room_id is 'Reference to parent room';
comment on column generated_inspirations.bullet_points is 'JSONB array of suggestion strings (e.g., ["Zoning", "LED lighting"])';
comment on column generated_inspirations.deleted_at is 'Soft delete timestamp. NULL means active record.';

-- ----------------------------------------------------------------------------
-- Table: inspiration_images
-- Purpose: Generated images for inspiration variants. Each variant has exactly 2 images.
-- RLS: Users can only access images from their own inspirations
-- Constraint: Each inspiration must have exactly 2 images (position 1 and 2)
-- Storage: storage_path contains path in Supabase Storage, not public URL
-- ----------------------------------------------------------------------------
create table inspiration_images (
    id uuid primary key default gen_random_uuid(),
    generated_inspiration_id uuid not null references generated_inspirations(id) on delete cascade,
    storage_path text not null,
    position smallint not null check (position in (1, 2)),
    created_at timestamptz not null default now(),
    unique (generated_inspiration_id, position)
);

comment on table inspiration_images is 'Generated images for inspiration variants. Each variant has 2 images.';
comment on column inspiration_images.id is 'Unique image identifier';
comment on column inspiration_images.generated_inspiration_id is 'Reference to parent inspiration';
comment on column inspiration_images.storage_path is 'Path to file in Supabase Storage (not public URL)';
comment on column inspiration_images.position is 'Image position in variant (1 or 2)';

-- ----------------------------------------------------------------------------
-- Table: saved_inspirations
-- Purpose: User-saved inspiration cards. Requires user account (soft-gate).
-- RLS: Users can only access their own saved inspirations
-- Soft Delete: Uses deleted_at column
-- Analytics: INSERT triggers InspirationSaved event
-- ----------------------------------------------------------------------------
create table saved_inspirations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    room_id uuid not null references rooms(id) on delete cascade,
    generated_inspiration_id uuid not null references generated_inspirations(id) on delete cascade,
    name text not null,
    style text,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

comment on table saved_inspirations is 'User-saved inspiration cards. Requires account (soft-gate).';
comment on column saved_inspirations.id is 'Unique saved inspiration identifier';
comment on column saved_inspirations.user_id is 'Reference to Supabase Auth user';
comment on column saved_inspirations.room_id is 'Reference to parent room';
comment on column saved_inspirations.generated_inspiration_id is 'Reference to generated inspiration';
comment on column saved_inspirations.name is 'User-provided name for saved inspiration';
comment on column saved_inspirations.style is 'Optional style description (e.g., Skandynawski, Industrialny)';
comment on column saved_inspirations.deleted_at is 'Soft delete timestamp. NULL means active record.';

-- ----------------------------------------------------------------------------
-- Table: analytics_events
-- Purpose: Universal analytics events table. Tracks InspirationSaved and future events.
-- RLS: Insert-only for clients. No read access (backend only via service_role)
-- JSONB Format: event_data contains flexible event-specific data
-- ----------------------------------------------------------------------------
create table analytics_events (
    id uuid primary key default gen_random_uuid(),
    event_type text not null,
    event_data jsonb not null,
    user_id uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);

comment on table analytics_events is 'Analytics events in universal format. Client can only insert, backend reads via service_role.';
comment on column analytics_events.id is 'Unique event identifier';
comment on column analytics_events.event_type is 'Event type identifier (e.g., InspirationSaved)';
comment on column analytics_events.event_data is 'JSONB with event-specific data';
comment on column analytics_events.user_id is 'Reference to user (nullable for guest events)';

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================

-- Projects: Index for user lookups on active projects
create index idx_projects_user_id on projects(user_id) where deleted_at is null;

-- Rooms: Indexes for project and room type lookups on active rooms
create index idx_rooms_project_id on rooms(project_id) where deleted_at is null;
create index idx_rooms_room_type_id on rooms(room_type_id);

-- Room Photos: Indexes for room lookups and photo type filtering on active photos
create index idx_room_photos_room_id on room_photos(room_id) where deleted_at is null;
create index idx_room_photos_photo_type on room_photos(photo_type);

-- Generated Inspirations: Index for room lookups on active inspirations
create index idx_generated_inspirations_room_id on generated_inspirations(room_id) where deleted_at is null;

-- Inspiration Images: Index for inspiration lookups
create index idx_inspiration_images_generated_inspiration_id on inspiration_images(generated_inspiration_id);

-- Saved Inspirations: Indexes for user and room lookups on active saves
create index idx_saved_inspirations_user_id on saved_inspirations(user_id) where deleted_at is null;
create index idx_saved_inspirations_room_id on saved_inspirations(room_id) where deleted_at is null;
create index idx_saved_inspirations_generated_inspiration_id on saved_inspirations(generated_inspiration_id);

-- Analytics Events: Composite indexes for common analytics queries
create index idx_analytics_events_event_type_created_at on analytics_events(event_type, created_at);
create index idx_analytics_events_user_id_created_at on analytics_events(user_id, created_at);

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table projects enable row level security;
alter table room_types enable row level security;
alter table rooms enable row level security;
alter table room_photos enable row level security;
alter table generated_inspirations enable row level security;
alter table inspiration_images enable row level security;
alter table saved_inspirations enable row level security;
alter table analytics_events enable row level security;

-- ----------------------------------------------------------------------------
-- RLS Policies: projects
-- Logic: Users can only access their own projects
-- ----------------------------------------------------------------------------

-- SELECT: Authenticated users can view their own projects
create policy select_own_projects_authenticated on projects
    for select
    to authenticated
    using (auth.uid() = user_id);

-- SELECT: Anonymous users cannot view projects
create policy select_own_projects_anon on projects
    for select
    to anon
    using (false);

-- INSERT: Authenticated users can create projects for themselves
create policy insert_own_projects_authenticated on projects
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- INSERT: Anonymous users cannot create projects
create policy insert_own_projects_anon on projects
    for insert
    to anon
    with check (false);

-- UPDATE: Authenticated users can update their own projects
create policy update_own_projects_authenticated on projects
    for update
    to authenticated
    using (auth.uid() = user_id);

-- UPDATE: Anonymous users cannot update projects
create policy update_own_projects_anon on projects
    for update
    to anon
    using (false);

-- DELETE: Authenticated users can delete their own projects
create policy delete_own_projects_authenticated on projects
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- DELETE: Anonymous users cannot delete projects
create policy delete_own_projects_anon on projects
    for delete
    to anon
    using (false);

-- ----------------------------------------------------------------------------
-- RLS Policies: room_types
-- Logic: Read-only for all users. Write access reserved for admins (via service_role).
-- ----------------------------------------------------------------------------

-- SELECT: Authenticated users can view all room types
create policy select_room_types_authenticated on room_types
    for select
    to authenticated
    using (true);

-- SELECT: Anonymous users can view all room types
create policy select_room_types_anon on room_types
    for select
    to anon
    using (true);

-- No INSERT/UPDATE/DELETE policies - write access only via service_role

-- ----------------------------------------------------------------------------
-- RLS Policies: rooms
-- Logic: Users can only access rooms from their own projects
-- ----------------------------------------------------------------------------

-- SELECT: Authenticated users can view rooms from their own projects
create policy select_own_rooms_authenticated on rooms
    for select
    to authenticated
    using (
        exists (
            select 1 from projects
            where projects.id = rooms.project_id
            and projects.user_id = auth.uid()
        )
    );

-- SELECT: Anonymous users cannot view rooms
create policy select_own_rooms_anon on rooms
    for select
    to anon
    using (false);

-- INSERT: Authenticated users can create rooms in their own projects
create policy insert_own_rooms_authenticated on rooms
    for insert
    to authenticated
    with check (
        exists (
            select 1 from projects
            where projects.id = rooms.project_id
            and projects.user_id = auth.uid()
        )
    );

-- INSERT: Anonymous users cannot create rooms
create policy insert_own_rooms_anon on rooms
    for insert
    to anon
    with check (false);

-- UPDATE: Authenticated users can update rooms from their own projects
create policy update_own_rooms_authenticated on rooms
    for update
    to authenticated
    using (
        exists (
            select 1 from projects
            where projects.id = rooms.project_id
            and projects.user_id = auth.uid()
        )
    );

-- UPDATE: Anonymous users cannot update rooms
create policy update_own_rooms_anon on rooms
    for update
    to anon
    using (false);

-- DELETE: Authenticated users can delete rooms from their own projects
create policy delete_own_rooms_authenticated on rooms
    for delete
    to authenticated
    using (
        exists (
            select 1 from projects
            where projects.id = rooms.project_id
            and projects.user_id = auth.uid()
        )
    );

-- DELETE: Anonymous users cannot delete rooms
create policy delete_own_rooms_anon on rooms
    for delete
    to anon
    using (false);

-- ----------------------------------------------------------------------------
-- RLS Policies: room_photos
-- Logic: Users can only access photos from their own rooms
-- ----------------------------------------------------------------------------

-- SELECT: Authenticated users can view photos from their own rooms
create policy select_own_room_photos_authenticated on room_photos
    for select
    to authenticated
    using (
        exists (
            select 1 from rooms
            join projects on projects.id = rooms.project_id
            where rooms.id = room_photos.room_id
            and projects.user_id = auth.uid()
        )
    );

-- SELECT: Anonymous users cannot view room photos
create policy select_own_room_photos_anon on room_photos
    for select
    to anon
    using (false);

-- INSERT: Authenticated users can upload photos to their own rooms
create policy insert_own_room_photos_authenticated on room_photos
    for insert
    to authenticated
    with check (
        exists (
            select 1 from rooms
            join projects on projects.id = rooms.project_id
            where rooms.id = room_photos.room_id
            and projects.user_id = auth.uid()
        )
    );

-- INSERT: Anonymous users cannot upload room photos
create policy insert_own_room_photos_anon on room_photos
    for insert
    to anon
    with check (false);

-- UPDATE: Authenticated users can update photos from their own rooms
create policy update_own_room_photos_authenticated on room_photos
    for update
    to authenticated
    using (
        exists (
            select 1 from rooms
            join projects on projects.id = rooms.project_id
            where rooms.id = room_photos.room_id
            and projects.user_id = auth.uid()
        )
    );

-- UPDATE: Anonymous users cannot update room photos
create policy update_own_room_photos_anon on room_photos
    for update
    to anon
    using (false);

-- DELETE: Authenticated users can delete photos from their own rooms
create policy delete_own_room_photos_authenticated on room_photos
    for delete
    to authenticated
    using (
        exists (
            select 1 from rooms
            join projects on projects.id = rooms.project_id
            where rooms.id = room_photos.room_id
            and projects.user_id = auth.uid()
        )
    );

-- DELETE: Anonymous users cannot delete room photos
create policy delete_own_room_photos_anon on room_photos
    for delete
    to anon
    using (false);

-- ----------------------------------------------------------------------------
-- RLS Policies: generated_inspirations
-- Logic: Users can only access inspirations from their own rooms
-- ----------------------------------------------------------------------------

-- SELECT: Authenticated users can view inspirations from their own rooms
create policy select_own_generated_inspirations_authenticated on generated_inspirations
    for select
    to authenticated
    using (
        exists (
            select 1 from rooms
            join projects on projects.id = rooms.project_id
            where rooms.id = generated_inspirations.room_id
            and projects.user_id = auth.uid()
        )
    );

-- SELECT: Anonymous users cannot view generated inspirations
create policy select_own_generated_inspirations_anon on generated_inspirations
    for select
    to anon
    using (false);

-- INSERT: Authenticated users can create inspirations for their own rooms
create policy insert_own_generated_inspirations_authenticated on generated_inspirations
    for insert
    to authenticated
    with check (
        exists (
            select 1 from rooms
            join projects on projects.id = rooms.project_id
            where rooms.id = generated_inspirations.room_id
            and projects.user_id = auth.uid()
        )
    );

-- INSERT: Anonymous users cannot create generated inspirations
create policy insert_own_generated_inspirations_anon on generated_inspirations
    for insert
    to anon
    with check (false);

-- UPDATE: Authenticated users can update inspirations from their own rooms
create policy update_own_generated_inspirations_authenticated on generated_inspirations
    for update
    to authenticated
    using (
        exists (
            select 1 from rooms
            join projects on projects.id = rooms.project_id
            where rooms.id = generated_inspirations.room_id
            and projects.user_id = auth.uid()
        )
    );

-- UPDATE: Anonymous users cannot update generated inspirations
create policy update_own_generated_inspirations_anon on generated_inspirations
    for update
    to anon
    using (false);

-- DELETE: Authenticated users can delete inspirations from their own rooms
create policy delete_own_generated_inspirations_authenticated on generated_inspirations
    for delete
    to authenticated
    using (
        exists (
            select 1 from rooms
            join projects on projects.id = rooms.project_id
            where rooms.id = generated_inspirations.room_id
            and projects.user_id = auth.uid()
        )
    );

-- DELETE: Anonymous users cannot delete generated inspirations
create policy delete_own_generated_inspirations_anon on generated_inspirations
    for delete
    to anon
    using (false);

-- ----------------------------------------------------------------------------
-- RLS Policies: inspiration_images
-- Logic: Users can only access images from their own inspirations
-- ----------------------------------------------------------------------------

-- SELECT: Authenticated users can view images from their own inspirations
create policy select_own_inspiration_images_authenticated on inspiration_images
    for select
    to authenticated
    using (
        exists (
            select 1 from generated_inspirations
            join rooms on rooms.id = generated_inspirations.room_id
            join projects on projects.id = rooms.project_id
            where generated_inspirations.id = inspiration_images.generated_inspiration_id
            and projects.user_id = auth.uid()
        )
    );

-- SELECT: Anonymous users cannot view inspiration images
create policy select_own_inspiration_images_anon on inspiration_images
    for select
    to anon
    using (false);

-- INSERT: Authenticated users can add images to their own inspirations
create policy insert_own_inspiration_images_authenticated on inspiration_images
    for insert
    to authenticated
    with check (
        exists (
            select 1 from generated_inspirations
            join rooms on rooms.id = generated_inspirations.room_id
            join projects on projects.id = rooms.project_id
            where generated_inspirations.id = inspiration_images.generated_inspiration_id
            and projects.user_id = auth.uid()
        )
    );

-- INSERT: Anonymous users cannot add inspiration images
create policy insert_own_inspiration_images_anon on inspiration_images
    for insert
    to anon
    with check (false);

-- UPDATE: Authenticated users can update images from their own inspirations
create policy update_own_inspiration_images_authenticated on inspiration_images
    for update
    to authenticated
    using (
        exists (
            select 1 from generated_inspirations
            join rooms on rooms.id = generated_inspirations.room_id
            join projects on projects.id = rooms.project_id
            where generated_inspirations.id = inspiration_images.generated_inspiration_id
            and projects.user_id = auth.uid()
        )
    );

-- UPDATE: Anonymous users cannot update inspiration images
create policy update_own_inspiration_images_anon on inspiration_images
    for update
    to anon
    using (false);

-- DELETE: Authenticated users can delete images from their own inspirations
create policy delete_own_inspiration_images_authenticated on inspiration_images
    for delete
    to authenticated
    using (
        exists (
            select 1 from generated_inspirations
            join rooms on rooms.id = generated_inspirations.room_id
            join projects on projects.id = rooms.project_id
            where generated_inspirations.id = inspiration_images.generated_inspiration_id
            and projects.user_id = auth.uid()
        )
    );

-- DELETE: Anonymous users cannot delete inspiration images
create policy delete_own_inspiration_images_anon on inspiration_images
    for delete
    to anon
    using (false);

-- ----------------------------------------------------------------------------
-- RLS Policies: saved_inspirations
-- Logic: Users can only access their own saved inspirations
-- Requirement: Requires user account (soft-gate)
-- ----------------------------------------------------------------------------

-- SELECT: Authenticated users can view their own saved inspirations
create policy select_own_saved_inspirations_authenticated on saved_inspirations
    for select
    to authenticated
    using (auth.uid() = user_id);

-- SELECT: Anonymous users cannot view saved inspirations
create policy select_own_saved_inspirations_anon on saved_inspirations
    for select
    to anon
    using (false);

-- INSERT: Authenticated users can save inspirations for themselves
create policy insert_own_saved_inspirations_authenticated on saved_inspirations
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- INSERT: Anonymous users cannot save inspirations (soft-gate)
create policy insert_own_saved_inspirations_anon on saved_inspirations
    for insert
    to anon
    with check (false);

-- UPDATE: Authenticated users can update their own saved inspirations
create policy update_own_saved_inspirations_authenticated on saved_inspirations
    for update
    to authenticated
    using (auth.uid() = user_id);

-- UPDATE: Anonymous users cannot update saved inspirations
create policy update_own_saved_inspirations_anon on saved_inspirations
    for update
    to anon
    using (false);

-- DELETE: Authenticated users can delete their own saved inspirations
create policy delete_own_saved_inspirations_authenticated on saved_inspirations
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- DELETE: Anonymous users cannot delete saved inspirations
create policy delete_own_saved_inspirations_anon on saved_inspirations
    for delete
    to anon
    using (false);

-- ----------------------------------------------------------------------------
-- RLS Policies: analytics_events
-- Logic: Insert-only for clients. No read access (backend reads via service_role)
-- Note: Both authenticated and anonymous users can record analytics events
-- ----------------------------------------------------------------------------

-- SELECT: No client access - backend only via service_role
-- (No SELECT policies = no client read access)

-- INSERT: Authenticated users can record analytics events
create policy insert_analytics_events_authenticated on analytics_events
    for insert
    to authenticated
    with check (true);

-- INSERT: Anonymous users can record analytics events
create policy insert_analytics_events_anon on analytics_events
    for insert
    to anon
    with check (true);

-- No UPDATE/DELETE policies - events are immutable from client perspective

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
