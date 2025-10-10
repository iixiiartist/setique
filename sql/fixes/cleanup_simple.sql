-- Simple cleanup - only check tables that exist

-- 1. Find profiles that exist
SELECT 'EXISTING PROFILES' as check_type;
SELECT id, email, username FROM profiles ORDER BY created_at DESC;

-- 2. Find orphaned datasets
SELECT 'ORPHANED DATASETS' as check_type;
SELECT 
  d.id,
  d.title,
  d.creator_id,
  'Creator exists: ' || (EXISTS(SELECT 1 FROM profiles WHERE id = d.creator_id))::text as creator_exists
FROM datasets d
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = d.creator_id);

-- 3. Find orphaned purchases
SELECT 'ORPHANED PURCHASES' as check_type;
SELECT 
  p.id,
  p.user_id,
  p.dataset_id,
  'User exists: ' || (EXISTS(SELECT 1 FROM profiles WHERE id = p.user_id))::text as user_exists,
  'Dataset exists: ' || (EXISTS(SELECT 1 FROM datasets WHERE id = p.dataset_id))::text as dataset_exists
FROM purchases p
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = p.user_id)
   OR NOT EXISTS (SELECT 1 FROM datasets WHERE id = p.dataset_id);

-- 4. Find orphaned beta_access
SELECT 'ORPHANED BETA ACCESS' as check_type;
SELECT 
  ba.id,
  ba.email,
  ba.user_id,
  'User exists: ' || (EXISTS(SELECT 1 FROM profiles WHERE id = ba.user_id))::text as user_exists
FROM beta_access ba
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = ba.user_id);

-- 5. CLEANUP - Remove orphaned records
BEGIN;

-- Delete orphaned purchases  
DELETE FROM purchases
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id);

-- Delete orphaned beta_access
DELETE FROM beta_access
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id);

SELECT 'Cleanup complete' as status;

COMMIT;

-- 6. Show what's left
SELECT 'REMAINING RECORDS' as check_type;
SELECT 
  'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Beta Access', COUNT(*) FROM beta_access
UNION ALL
SELECT 'Datasets', COUNT(*) FROM datasets
UNION ALL
SELECT 'Purchases', COUNT(*) FROM purchases;
