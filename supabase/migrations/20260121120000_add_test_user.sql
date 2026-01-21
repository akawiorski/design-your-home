-- ============================================================================
-- Migration: Add Test User for Development
-- Description: Creates a test user in auth.users for MVP development
-- Author: Database Schema Team
-- Date: 2026-01-21
-- 
-- Purpose: Provides a valid user_id for testing without full authentication
-- Note: This should be removed or disabled in production
-- ============================================================================

-- Insert test user into auth.users
-- This matches the DEFAULT_USER_ID constant in src/db/supabase.client.ts
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
) VALUES (
    '525b1489-40a7-470a-afc4-65f1aa737cfe',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@example.com',
    -- This is a bcrypt hash of 'password' - for testing only
    '$2a$10$YZX7YZX7YZX7YZX7YZX7YeJ7YZX7YZX7YZX7YZX7YZX7YZX7YZX7Y',
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- Also create an identity record for the test user
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '525b1489-40a7-470a-afc4-65f1aa737cfe',
    '525b1489-40a7-470a-afc4-65f1aa737cfe',
    '525b1489-40a7-470a-afc4-65f1aa737cfe',
    '{"sub": "525b1489-40a7-470a-afc4-65f1aa737cfe", "email": "test@example.com"}',
    'email',
    now(),
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;
