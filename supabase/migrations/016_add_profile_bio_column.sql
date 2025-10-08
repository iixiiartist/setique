-- Add missing bio column to profiles for social experiences
-- Ensures user discovery and profile pages can load extended profile metadata

BEGIN;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

COMMIT;
