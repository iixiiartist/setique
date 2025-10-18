-- Migration: Social Analytics Fields for Setique Social
-- Date: October 17, 2025
-- Purpose: Add platform detection, schema analysis, hygiene pipeline, and pricing fields
-- Part of: 30-Day MVP Implementation (Week 1 - Foundation)

-- ============================================================================
-- PART 1: Add Social Analytics Columns to datasets table
-- ============================================================================

ALTER TABLE datasets
  -- Platform & Data Type
  ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('tiktok', 'youtube', 'instagram', 'linkedin', 'shopify', 'twitter', 'facebook', 'spotify', 'other')),
  ADD COLUMN IF NOT EXISTS data_type TEXT CHECK (data_type IN ('social_analytics', 'ecommerce', 'professional', 'other')) DEFAULT 'other',
  
  -- Extended Fields & Versioning
  ADD COLUMN IF NOT EXISTS has_extended_fields BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS extended_field_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extended_fields_list JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dataset_version TEXT CHECK (dataset_version IN ('standard', 'extended', 'both')) DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS standard_version_id UUID REFERENCES datasets(id),
  ADD COLUMN IF NOT EXISTS extended_version_id UUID REFERENCES datasets(id),
  
  -- Schema Detection & Analysis
  ADD COLUMN IF NOT EXISTS schema_detected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS schema_confidence DECIMAL(3,2) CHECK (schema_confidence >= 0 AND schema_confidence <= 1),
  ADD COLUMN IF NOT EXISTS canonical_fields JSONB DEFAULT '{}'::jsonb,
  
  -- PII Hygiene Pipeline
  ADD COLUMN IF NOT EXISTS hygiene_version TEXT DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS hygiene_passed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pii_issues_found INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hygiene_report JSONB DEFAULT '{}'::jsonb,
  
  -- Dynamic Pricing
  ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS price_confidence DECIMAL(3,2) CHECK (price_confidence >= 0 AND price_confidence <= 1),
  ADD COLUMN IF NOT EXISTS pricing_factors JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- PART 2: Add Indexes for Query Performance
-- ============================================================================

-- Platform filtering (for marketplace filters)
CREATE INDEX IF NOT EXISTS idx_datasets_platform 
  ON datasets(platform) 
  WHERE platform IS NOT NULL;

-- Data type filtering
CREATE INDEX IF NOT EXISTS idx_datasets_data_type 
  ON datasets(data_type);

-- Extended fields filtering (for buyers looking for platform-specific data)
CREATE INDEX IF NOT EXISTS idx_datasets_has_extended 
  ON datasets(has_extended_fields) 
  WHERE has_extended_fields = true;

-- Hygiene verification filtering (for buyers needing clean data)
CREATE INDEX IF NOT EXISTS idx_datasets_hygiene_passed 
  ON datasets(hygiene_passed) 
  WHERE hygiene_passed = true;

-- Composite index for social analytics marketplace queries
CREATE INDEX IF NOT EXISTS idx_datasets_social_marketplace 
  ON datasets(platform, has_extended_fields, hygiene_passed) 
  WHERE data_type = 'social_analytics';

-- ============================================================================
-- PART 3: Add Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN datasets.platform IS 'Detected platform source (tiktok, youtube, instagram, linkedin, shopify, etc.)';
COMMENT ON COLUMN datasets.data_type IS 'Category of data (social_analytics, ecommerce, professional, other)';
COMMENT ON COLUMN datasets.has_extended_fields IS 'Whether dataset includes platform-specific extended fields beyond USS core';
COMMENT ON COLUMN datasets.extended_field_count IS 'Number of platform-specific extended fields included';
COMMENT ON COLUMN datasets.extended_fields_list IS 'Array of extended field names (e.g., ["tiktok_sound_name", "tiktok_duet_count"])';
COMMENT ON COLUMN datasets.dataset_version IS 'Version type: standard (USS core only), extended (core + platform fields), both (dual versions)';
COMMENT ON COLUMN datasets.standard_version_id IS 'Foreign key to standard version if this is extended version';
COMMENT ON COLUMN datasets.extended_version_id IS 'Foreign key to extended version if this is standard version';
COMMENT ON COLUMN datasets.schema_detected IS 'Whether automatic schema detection ran successfully';
COMMENT ON COLUMN datasets.schema_confidence IS 'Confidence score (0-1) for platform detection accuracy';
COMMENT ON COLUMN datasets.canonical_fields IS 'Mapping of detected headers to USS v1.0 canonical field names';
COMMENT ON COLUMN datasets.hygiene_version IS 'Version of PII hygiene pipeline (v1.0, v1.1, etc.)';
COMMENT ON COLUMN datasets.hygiene_passed IS 'Whether dataset passed all PII hygiene checks';
COMMENT ON COLUMN datasets.pii_issues_found IS 'Count of PII patterns detected and removed';
COMMENT ON COLUMN datasets.hygiene_report IS 'Detailed hygiene report with patterns found, severity, actions taken';
COMMENT ON COLUMN datasets.suggested_price IS 'AI-calculated suggested price based on 5 factors (rows, date range, extended fields, platform, curation)';
COMMENT ON COLUMN datasets.price_confidence IS 'Confidence score (0-1) for pricing suggestion accuracy';
COMMENT ON COLUMN datasets.pricing_factors IS 'Breakdown of pricing calculation: base price, multipliers, reasoning';

-- ============================================================================
-- PART 4: Sample Data for Testing (Optional - Comment out for production)
-- ============================================================================

-- Uncomment for local testing:
-- UPDATE datasets 
-- SET 
--   platform = 'tiktok',
--   data_type = 'social_analytics',
--   has_extended_fields = true,
--   extended_field_count = 12,
--   extended_fields_list = '["tiktok_sound_name", "tiktok_sound_id", "tiktok_duet_count", "tiktok_stitch_count", "tiktok_video_duration", "tiktok_is_paid_partnership", "tiktok_effect_ids", "tiktok_hashtag_names", "tiktok_caption_length", "tiktok_music_genre", "tiktok_trending_score", "tiktok_virality_coefficient"]'::jsonb,
--   dataset_version = 'both',
--   schema_detected = true,
--   schema_confidence = 0.92,
--   hygiene_passed = true,
--   pii_issues_found = 3,
--   suggested_price = 85.00,
--   price_confidence = 0.88
-- WHERE title ILIKE '%tiktok%' OR title ILIKE '%social%'
-- LIMIT 5;

-- ============================================================================
-- PART 5: Rollback Instructions
-- ============================================================================

-- To rollback this migration:
-- ALTER TABLE datasets
--   DROP COLUMN IF EXISTS platform,
--   DROP COLUMN IF EXISTS data_type,
--   DROP COLUMN IF EXISTS has_extended_fields,
--   DROP COLUMN IF EXISTS extended_field_count,
--   DROP COLUMN IF EXISTS extended_fields_list,
--   DROP COLUMN IF EXISTS dataset_version,
--   DROP COLUMN IF EXISTS standard_version_id,
--   DROP COLUMN IF EXISTS extended_version_id,
--   DROP COLUMN IF EXISTS schema_detected,
--   DROP COLUMN IF EXISTS schema_confidence,
--   DROP COLUMN IF EXISTS canonical_fields,
--   DROP COLUMN IF EXISTS hygiene_version,
--   DROP COLUMN IF EXISTS hygiene_passed,
--   DROP COLUMN IF EXISTS pii_issues_found,
--   DROP COLUMN IF EXISTS hygiene_report,
--   DROP COLUMN IF EXISTS suggested_price,
--   DROP COLUMN IF EXISTS price_confidence,
--   DROP COLUMN IF EXISTS pricing_factors;
--
-- DROP INDEX IF EXISTS idx_datasets_platform;
-- DROP INDEX IF EXISTS idx_datasets_data_type;
-- DROP INDEX IF EXISTS idx_datasets_has_extended;
-- DROP INDEX IF EXISTS idx_datasets_hygiene_passed;
-- DROP INDEX IF EXISTS idx_datasets_social_marketplace;
