-- Delete test users (CAREFUL - this is permanent!)
-- This will cascade delete their profiles, beta_access, datasets, etc.

-- 1. First, see what will be deleted
SELECT 'USERS TO DELETE' as check_type;
SELECT 
  id,
  email,
  created_at,
  'Type the email below to confirm deletion' as warning
FROM auth.users
WHERE email NOT IN (
  'joseph@anconsulting.us',  -- Your admin email - KEEP THIS
  'setique.e2etest@gmail.com'  -- E2E test user - KEEP THIS
)
ORDER BY created_at DESC;

-- 2. Count what will be deleted
SELECT 'DELETION SUMMARY' as check_type;
SELECT 
  COUNT(*) as users_to_delete,
  string_agg(email, ', ') as emails
FROM auth.users
WHERE email NOT IN (
  'joseph@anconsulting.us',
  'setique.e2etest@gmail.com'
);

-- 3. DELETE THE USERS
-- WARNING: This deletes users from auth.users
-- We need to handle tables without CASCADE first, then delete users

-- Get test user IDs
DO $$
DECLARE
  test_user_ids UUID[];
  test_profile_ids UUID[];
  deleted_count INTEGER;
BEGIN
  -- Get array of test user IDs to delete
  SELECT array_agg(id) INTO test_user_ids
  FROM auth.users
  WHERE email NOT IN ('joseph@anconsulting.us', 'setique.e2etest@gmail.com');
  
  -- Get corresponding profile IDs (same as user IDs but be explicit)
  SELECT array_agg(id) INTO test_profile_ids
  FROM profiles
  WHERE id = ANY(test_user_ids);
  
  RAISE NOTICE 'Deleting % test users', array_length(test_user_ids, 1);
  
  -- Delete from tables that don't have CASCADE (in dependency order)
  
  -- === PRO CURATOR SYSTEM ===
  
  -- 1. Delete curator submissions (references curation_requests and pro_curators)
  DELETE FROM curator_submissions WHERE curator_id IN (
    SELECT id FROM pro_curators WHERE user_id = ANY(test_user_ids)
  );
  
  -- 2. Delete request messages (references curation_requests)
  DELETE FROM request_messages WHERE sender_id = ANY(test_user_ids);
  
  -- 3. Delete curator proposals (references pro_curators)
  DELETE FROM curator_proposals WHERE curator_id IN (
    SELECT id FROM pro_curators WHERE user_id = ANY(test_user_ids)
  );
  
  -- 4. Delete curation requests assigned to test curators
  UPDATE curation_requests SET assigned_curator_id = NULL 
  WHERE assigned_curator_id IN (
    SELECT id FROM pro_curators WHERE user_id = ANY(test_user_ids)
  );
  
  -- 5. Delete curation requests created by test users (after nulling assigned_curator_id)
  DELETE FROM curation_requests WHERE creator_id = ANY(test_user_ids);
  
  -- 6. Delete dataset partnerships
  DELETE FROM dataset_partnerships 
  WHERE owner_id = ANY(test_user_ids) OR curator_user_id = ANY(test_user_ids);
  
  -- 7. Delete pro_curator records
  DELETE FROM pro_curators WHERE user_id = ANY(test_user_ids);
  
  -- === EARNINGS & PAYOUTS ===
  
  -- 8. Delete payout requests
  DELETE FROM payout_requests WHERE creator_id = ANY(test_profile_ids);
  
  -- 9. Delete creator payout accounts
  DELETE FROM creator_payout_accounts WHERE creator_id = ANY(test_profile_ids);
  
  -- 10. Delete creator earnings
  DELETE FROM creator_earnings WHERE creator_id = ANY(test_profile_ids);
  
  -- === MODERATION SYSTEM ===
  
  -- 11. Delete moderation logs (moderator_id references profiles)
  DELETE FROM moderation_logs WHERE moderator_id = ANY(test_profile_ids);
  
  -- 12. Delete dataset reports (reporter_id and reviewed_by reference profiles)
  DELETE FROM dataset_reports 
  WHERE reporter_id = ANY(test_profile_ids) OR reviewed_by = ANY(test_profile_ids);
  
  -- === DOWNLOADS ===
  
  -- 13. Delete download logs
  DELETE FROM download_logs WHERE user_id = ANY(test_profile_ids);
  
  -- === FEEDBACK (user_id will be SET NULL, but delete test user feedback) ===
  
  -- 14. Delete feedback from test users
  DELETE FROM user_feedback WHERE user_id = ANY(test_profile_ids);
  
  -- === PURCHASES & DATASETS ===
  -- Note: These should CASCADE from datasets, but be explicit
  
  -- 15. Delete purchases (will cascade from profiles)
  DELETE FROM purchases WHERE user_id = ANY(test_profile_ids);
  
  -- 16. Delete datasets (will cascade to many child tables)
  DELETE FROM datasets WHERE creator_id = ANY(test_profile_ids);
  
  -- === CORE USER DATA ===
  -- Now delete the users - this will CASCADE to:
  -- - profiles (CASCADE)
  -- - beta_access (CASCADE via profiles)
  -- - user_follows (CASCADE)
  -- - trust_level_history (CASCADE via profiles)
  
  -- 17. Finally, delete the auth.users records
  DELETE FROM auth.users WHERE id = ANY(test_user_ids);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Successfully deleted % test users and all related data', deleted_count;
END $$;

-- 4. After deletion, verify what's left
SELECT 'REMAINING USERS' as check_type;
SELECT 
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

SELECT '⚠️ UNCOMMENT THE DELETE STATEMENT TO EXECUTE' as instruction;
SELECT 'Make sure to keep your admin email!' as warning;
