-- Fix duplicate foreign key constraints that cause PostgREST 400 errors
-- Remove incorrect foreign keys added in migration 013 that conflict with original schema

BEGIN;

-- Remove the duplicate foreign key from datasets.creator_id to auth.users
-- The original datasets_creator_id_fkey (datasets.creator_id -> profiles.id) is correct
ALTER TABLE datasets 
DROP CONSTRAINT IF EXISTS fk_datasets_creator;

-- Remove the duplicate foreign key from purchases.user_id to auth.users
-- The original purchases_user_id_fkey (purchases.user_id -> profiles.id) should be kept
ALTER TABLE purchases 
DROP CONSTRAINT IF EXISTS fk_purchases_user;

-- Remove the duplicate foreign key from purchases.dataset_id
-- The original purchases_dataset_id_fkey is correct
ALTER TABLE purchases 
DROP CONSTRAINT IF EXISTS fk_purchases_dataset;

-- Remove any other duplicate foreign keys from migration 013 that conflict
-- Keep original constraints from initial schema, remove duplicates

COMMIT;
