-- ============================================================================
-- VERIFICATION QUERIES - Run these after migration to confirm success
-- ============================================================================

-- QUERY 1: Verify all 18 columns were added
-- Expected result: 16 rows (18 columns total, 2 are FK references)
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'datasets' 
  AND column_name IN (
    'platform', 
    'data_type', 
    'has_extended_fields',
    'extended_field_count',
    'extended_fields_list',
    'dataset_version',
    'standard_version_id',
    'extended_version_id',
    'schema_detected',
    'schema_confidence',
    'canonical_fields',
    'hygiene_version',
    'hygiene_passed',
    'pii_issues_found',
    'hygiene_report',
    'suggested_price',
    'price_confidence',
    'pricing_factors'
  )
ORDER BY column_name;

-- ============================================================================

-- QUERY 2: Verify all 5 indexes were created
-- Expected result: 5 rows
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'datasets' 
  AND indexname IN (
    'idx_datasets_platform',
    'idx_datasets_data_type',
    'idx_datasets_has_extended',
    'idx_datasets_hygiene_passed',
    'idx_datasets_social_marketplace'
  )
ORDER BY indexname;

-- ============================================================================

-- QUERY 3: Verify column comments were added
-- Expected result: 18 rows with descriptions
SELECT 
  column_name,
  col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as column_comment
FROM information_schema.columns 
WHERE table_name = 'datasets' 
  AND column_name IN (
    'platform', 'data_type', 'has_extended_fields', 'extended_field_count',
    'extended_fields_list', 'dataset_version', 'standard_version_id', 
    'extended_version_id', 'schema_detected', 'schema_confidence',
    'canonical_fields', 'hygiene_version', 'hygiene_passed', 
    'pii_issues_found', 'hygiene_report', 'suggested_price',
    'price_confidence', 'pricing_factors'
  )
  AND col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) IS NOT NULL
ORDER BY column_name;

-- ============================================================================

-- QUERY 4: Check that existing datasets are unaffected
-- Expected result: All existing datasets with new columns showing defaults
SELECT 
  id,
  title,
  platform,
  data_type,
  has_extended_fields,
  schema_detected,
  hygiene_passed,
  created_at
FROM datasets 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================================================

-- QUERY 5: Test inserting a new record with all new fields
-- This creates a sample TikTok dataset to verify everything works
INSERT INTO datasets (
  user_id,
  title,
  description,
  price,
  platform,
  data_type,
  has_extended_fields,
  extended_field_count,
  extended_fields_list,
  dataset_version,
  schema_detected,
  schema_confidence,
  hygiene_passed,
  pii_issues_found,
  suggested_price,
  price_confidence,
  pricing_factors,
  status
) VALUES (
  (SELECT id FROM profiles LIMIT 1), -- Replace with your user_id
  'TEST: TikTok Creator Analytics - Q4 2025',
  'Test dataset with extended fields (sound names, duets, stitches, virality)',
  85.00,
  'tiktok',
  'social_analytics',
  true,
  12,
  '["tiktok_sound_name", "tiktok_sound_id", "tiktok_duet_count", "tiktok_stitch_count", "tiktok_video_duration", "tiktok_is_paid_partnership", "tiktok_effect_ids", "tiktok_hashtag_names", "tiktok_caption_length", "tiktok_music_genre", "tiktok_trending_score", "tiktok_virality_coefficient"]'::jsonb,
  'extended',
  true,
  0.92,
  true,
  3,
  85.00,
  0.88,
  '{"basePrice": 75, "dateMultiplier": 1.5, "platformMultiplier": 1.3, "extendedFieldsMultiplier": 2.0, "curationMultiplier": 1.0, "engagementMultiplier": 1.0}'::jsonb,
  'draft' -- Keep as draft for testing
)
RETURNING id, title, platform, has_extended_fields, suggested_price;

-- ============================================================================

-- QUERY 6: Verify the test record was inserted correctly
SELECT 
  id,
  title,
  platform,
  data_type,
  has_extended_fields,
  extended_field_count,
  array_length(extended_fields_list::json::text[]::jsonb[], 1) as extended_fields_array_length,
  dataset_version,
  schema_detected,
  schema_confidence,
  hygiene_passed,
  pii_issues_found,
  suggested_price,
  price_confidence,
  pricing_factors->>'basePrice' as base_price,
  pricing_factors->>'extendedFieldsMultiplier' as extended_multiplier,
  created_at
FROM datasets 
WHERE title LIKE 'TEST:%'
ORDER BY created_at DESC 
LIMIT 1;

-- ============================================================================

-- QUERY 7: Clean up test record (optional - run after verification)
-- DELETE FROM datasets WHERE title LIKE 'TEST:%';

-- ============================================================================

-- SUCCESS CHECKLIST:
-- [ ] Query 1: Shows 16+ columns
-- [ ] Query 2: Shows 5 indexes
-- [ ] Query 3: Shows column descriptions
-- [ ] Query 4: Existing datasets intact with default values
-- [ ] Query 5: Test insert successful
-- [ ] Query 6: Test record has all fields populated correctly
-- [ ] Query 7: Can delete test record when done

-- ============================================================================
-- If all queries pass: MIGRATION SUCCESSFUL! ✅
-- Ready for Week 2 implementation!
-- ============================================================================
