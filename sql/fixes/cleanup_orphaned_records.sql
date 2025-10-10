-- Find and clean up orphaned records causing 406/400 errors

-- 1. Find profiles that exist
SELECT 'EXISTING PROFILES' as check_type;
SELECT id, email, username FROM profiles ORDER BY created_at DESC;

-- 2. Find orphaned follows (pointing to non-existent profiles)
SELECT 'ORPHANED FOLLOWS' as check_type;
SELECT 
  f.id,
  f.follower_id,
  f.following_id,
  'Follower exists: ' || (EXISTS(SELECT 1 FROM profiles WHERE id = f.follower_id))::text as follower_exists,
  'Following exists: ' || (EXISTS(SELECT 1 FROM profiles WHERE id = f.following_id))::text as following_exists
FROM follows f
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = f.follower_id)
   OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = f.following_id);

-- 3. Find orphaned datasets
SELECT 'ORPHANED DATASETS' as check_type;
SELECT 
  d.id,
  d.title,
  d.creator_id,
  'Creator exists: ' || (EXISTS(SELECT 1 FROM profiles WHERE id = d.creator_id))::text as creator_exists
FROM datasets d
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = d.creator_id);

-- 4. Find orphaned purchases
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

-- 5. Find orphaned beta_access (should cascade delete, but check anyway)
SELECT 'ORPHANED BETA ACCESS' as check_type;
SELECT 
  ba.id,
  ba.email,
  ba.user_id,
  'User exists: ' || (EXISTS(SELECT 1 FROM profiles WHERE id = ba.user_id))::text as user_exists
FROM beta_access ba
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = ba.user_id);

-- 6. CLEANUP - Remove orphaned records
BEGIN;

-- Delete orphaned follows
DELETE FROM follows 
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = follower_id)
   OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = following_id);

-- Delete orphaned purchases  
DELETE FROM purchases
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id);

-- Delete orphaned beta_access
DELETE FROM beta_access
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id);

-- Note: NOT deleting orphaned datasets - they might be valuable data

SELECT 'Cleanup complete' as status;

COMMIT;

-- 7. Show what's left
SELECT 'REMAINING RECORDS' as check_type;
SELECT 
  'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Beta Access', COUNT(*) FROM beta_access
UNION ALL
SELECT 'Follows', COUNT(*) FROM follows
UNION ALL
SELECT 'Datasets', COUNT(*) FROM datasets
UNION ALL
SELECT 'Purchases', COUNT(*) FROM purchases;
