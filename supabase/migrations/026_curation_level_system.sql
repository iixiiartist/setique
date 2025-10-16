-- Migration: Add Curation Level System with Admin Review
-- Purpose: Enable three-tier dataset curation (raw/partial/curated) with admin review workflow
-- Date: October 2025
-- Related: docs/RAW_UPLOADS_IMPLEMENTATION_PLAN.md

BEGIN;

-- =====================================================
-- STEP 1: Add curation_level column to datasets
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS curation_level TEXT DEFAULT 'curated' 
CHECK (curation_level IN ('raw', 'partial', 'curated'));

COMMENT ON COLUMN datasets.curation_level IS 
'Indicates data preparation level:
- raw: Unprocessed data, no labels/metadata (requires admin review for non-Pro-Curators)
- partial: Some labeling/organization done (20-80% complete)
- curated: Fully labeled, cleaned, ready for training';

-- =====================================================
-- STEP 2: Add sample preview URLs for raw/partial data
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS sample_preview_urls TEXT[] DEFAULT '{}';

COMMENT ON COLUMN datasets.sample_preview_urls IS 
'Array of public URLs to sample files (3-10 examples) for preview before purchase.
Required for raw and partial datasets.';

-- =====================================================
-- STEP 3: Add metadata completeness indicator
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS metadata_completeness INTEGER DEFAULT 100 
CHECK (metadata_completeness >= 0 AND metadata_completeness <= 100);

COMMENT ON COLUMN datasets.metadata_completeness IS 
'Percentage of files with complete metadata/labels (0-100).
- Raw: 0-10%
- Partial: 20-80%
- Curated: 90-100%';

-- =====================================================
-- STEP 4: Add readme/documentation field
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS readme_content TEXT;

COMMENT ON COLUMN datasets.readme_content IS 
'Markdown-formatted documentation about dataset structure, use cases, limitations.
Required for raw datasets (minimum 100 characters).';

-- =====================================================
-- STEP 5: Add quality indicators
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT NULL 
CHECK (quality_score >= 1 AND quality_score <= 5);

COMMENT ON COLUMN datasets.quality_score IS 
'Admin/community-assigned quality rating (1-5 stars).
NULL = not yet rated.';

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS verified_by_curator BOOLEAN DEFAULT false;

COMMENT ON COLUMN datasets.verified_by_curator IS 
'True if reviewed and approved by Pro Curator (trust_level >= 3).
Shows as "Verified" badge in marketplace.';

-- =====================================================
-- STEP 6: Add admin review workflow fields
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'approved' 
CHECK (review_status IN ('pending', 'approved', 'rejected'));

COMMENT ON COLUMN datasets.review_status IS 
'Admin review status for raw uploads from non-Pro-Curators:
- pending: Awaiting admin review (not listed publicly)
- approved: Reviewed and approved for marketplace
- rejected: Does not meet quality/content standards
Note: Pro Curators (trust_level >= 3) are auto-approved.';

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);

COMMENT ON COLUMN datasets.reviewed_by IS 
'Admin user (is_admin = true) who reviewed this raw upload.
NULL if auto-approved (Pro Curator) or not yet reviewed.';

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN datasets.reviewed_at IS 
'Timestamp when admin review was completed.
NULL if auto-approved or pending review.';

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS review_notes TEXT;

COMMENT ON COLUMN datasets.review_notes IS 
'Internal notes from admin about why dataset was approved/rejected.
Visible to creator if rejected (helps them improve and resubmit).';

-- =====================================================
-- STEP 7: Add curation upgrade tracking
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS original_curation_level TEXT;

COMMENT ON COLUMN datasets.original_curation_level IS 
'Original curation level if dataset was upgraded (raw→partial or partial→curated).
NULL if never upgraded. Used to track Pro Curator upgrade partnerships.';

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMPTZ;

COMMENT ON COLUMN datasets.upgraded_at IS 
'Timestamp when curation level was upgraded via Pro Curator.
NULL if never upgraded. Triggers revenue split recalculation.';

-- =====================================================
-- STEP 8: Update existing datasets (backward compatible)
-- =====================================================

-- Set all existing datasets to 'curated' with 'approved' review status
UPDATE datasets 
SET curation_level = 'curated',
    metadata_completeness = 100,
    review_status = 'approved'
WHERE curation_level IS NULL OR review_status IS NULL;

-- =====================================================
-- STEP 9: Create indexes for filtering and admin dashboard
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_datasets_curation_level 
ON datasets(curation_level) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_datasets_review_status 
ON datasets(review_status) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_datasets_review_status_created 
ON datasets(review_status, created_at DESC) 
WHERE review_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_datasets_quality_score 
ON datasets(quality_score DESC NULLS LAST) 
WHERE is_active = true AND review_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_datasets_verified 
ON datasets(verified_by_curator) 
WHERE is_active = true AND review_status = 'approved' AND verified_by_curator = true;

-- =====================================================
-- STEP 10: Update RLS policies for admin review access
-- =====================================================

-- Drop existing SELECT policies for datasets (we'll recreate them)
DROP POLICY IF EXISTS "Public can view approved datasets" ON datasets;
DROP POLICY IF EXISTS "Creators can view own datasets" ON datasets;
DROP POLICY IF EXISTS "Admins can view all datasets" ON datasets;

-- Public can only see approved datasets (not pending/rejected)
CREATE POLICY "Public can view approved datasets" ON datasets
FOR SELECT
USING (
  is_active = true 
  AND review_status = 'approved'
);

-- Creators can view their own datasets regardless of review status
CREATE POLICY "Creators can view own datasets" ON datasets
FOR SELECT
USING (
  creator_id = auth.uid()
);

-- Admins can view all datasets (for review dashboard)
CREATE POLICY "Admins can view all datasets" ON datasets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- =====================================================
-- STEP 11: Create admin review helper functions
-- =====================================================

-- Function to check if user is Pro Curator (auto-approve eligible)
CREATE OR REPLACE FUNCTION is_pro_curator(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT trust_level >= 3 FROM profiles WHERE id = user_id),
    false
  );
$$ LANGUAGE SQL STABLE;

-- Function to auto-set review_status based on creator's Pro status
CREATE OR REPLACE FUNCTION set_review_status_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only apply to raw uploads
  IF NEW.curation_level = 'raw' THEN
    -- Check if creator is Pro Curator
    IF is_pro_curator(NEW.creator_id) THEN
      NEW.review_status := 'approved';
      NEW.is_active := true;
    ELSE
      NEW.review_status := 'pending';
      NEW.is_active := false; -- Don't list until approved
    END IF;
  ELSE
    -- Partial and curated datasets are auto-approved
    NEW.review_status := 'approved';
    NEW.is_active := COALESCE(NEW.is_active, true);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set review status on dataset insert
DROP TRIGGER IF EXISTS set_review_status_trigger ON datasets;
CREATE TRIGGER set_review_status_trigger
  BEFORE INSERT ON datasets
  FOR EACH ROW
  EXECUTE FUNCTION set_review_status_on_insert();

COMMIT;

-- =====================================================
-- Verification queries (for testing)
-- =====================================================

-- Check new columns exist
SELECT 
  'Curation Level System Migration Complete' as status,
  COUNT(*) as total_datasets,
  COUNT(*) FILTER (WHERE curation_level = 'curated') as curated,
  COUNT(*) FILTER (WHERE curation_level = 'partial') as partial,
  COUNT(*) FILTER (WHERE curation_level = 'raw') as raw,
  COUNT(*) FILTER (WHERE review_status = 'approved') as approved,
  COUNT(*) FILTER (WHERE review_status = 'pending') as pending,
  COUNT(*) FILTER (WHERE review_status = 'rejected') as rejected
FROM datasets;

-- Check indexes were created
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename = 'datasets'
  AND indexname LIKE 'idx_datasets_%'
ORDER BY indexname;

SELECT '✅ Migration 026 completed successfully!' as result;
