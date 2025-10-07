-- Migration 013: Add Foreign Key Constraints
-- Purpose: Add missing foreign key constraints to enable PostgREST automatic joins
-- Date: 2025-10-06

-- ============================================
-- PART 1: Add Foreign Keys to curation_requests
-- ============================================

-- Add foreign key for creator_id -> auth.users
ALTER TABLE curation_requests 
  ADD CONSTRAINT fk_curation_requests_creator 
  FOREIGN KEY (creator_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Add foreign key for assigned_curator_id -> pro_curators (if not null)
ALTER TABLE curation_requests 
  ADD CONSTRAINT fk_curation_requests_assigned_curator 
  FOREIGN KEY (assigned_curator_id) 
  REFERENCES pro_curators(id) 
  ON DELETE SET NULL;

-- ============================================
-- PART 2: Add Foreign Keys to curator_proposals
-- ============================================

-- Add foreign key for request_id -> curation_requests
ALTER TABLE curator_proposals 
  ADD CONSTRAINT fk_curator_proposals_request 
  FOREIGN KEY (request_id) 
  REFERENCES curation_requests(id) 
  ON DELETE CASCADE;

-- Add foreign key for curator_id -> pro_curators
ALTER TABLE curator_proposals 
  ADD CONSTRAINT fk_curator_proposals_curator 
  FOREIGN KEY (curator_id) 
  REFERENCES pro_curators(id) 
  ON DELETE CASCADE;

-- ============================================
-- PART 3: Add Foreign Keys to Other Related Tables
-- ============================================

-- datasets table
ALTER TABLE datasets 
  ADD CONSTRAINT fk_datasets_creator 
  FOREIGN KEY (creator_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- profiles table - id IS the foreign key to auth.users
-- This constraint may already exist from initial schema
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE profiles 
  ADD CONSTRAINT fk_profiles_user 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- pro_curators table
ALTER TABLE pro_curators 
  ADD CONSTRAINT fk_pro_curators_user 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- deletion_requests table
-- Uses requester_id NOT user_id!
ALTER TABLE deletion_requests 
  ADD CONSTRAINT fk_deletion_requests_requester 
  FOREIGN KEY (requester_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE deletion_requests 
  ADD CONSTRAINT fk_deletion_requests_dataset 
  FOREIGN KEY (dataset_id) 
  REFERENCES datasets(id) 
  ON DELETE CASCADE;

-- deletion_requests also has reviewed_by column
ALTER TABLE deletion_requests 
  ADD CONSTRAINT fk_deletion_requests_reviewer 
  FOREIGN KEY (reviewed_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- purchases table
-- Uses user_id NOT buyer_id!
ALTER TABLE purchases 
  ADD CONSTRAINT fk_purchases_user 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE purchases 
  ADD CONSTRAINT fk_purchases_dataset 
  FOREIGN KEY (dataset_id) 
  REFERENCES datasets(id) 
  ON DELETE CASCADE;

-- download_logs table (NOT "downloads")
ALTER TABLE download_logs 
  ADD CONSTRAINT fk_download_logs_user 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE download_logs 
  ADD CONSTRAINT fk_download_logs_dataset 
  FOREIGN KEY (dataset_id) 
  REFERENCES datasets(id) 
  ON DELETE CASCADE;

ALTER TABLE download_logs 
  ADD CONSTRAINT fk_download_logs_purchase 
  FOREIGN KEY (purchase_id) 
  REFERENCES purchases(id) 
  ON DELETE SET NULL;

-- Note: creator_payouts table doesn't exist yet (future feature)
-- Note: user_follows table already has FK constraints from migration 012

-- ============================================
-- VERIFICATION
-- ============================================

-- Query to verify all foreign keys were created
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
