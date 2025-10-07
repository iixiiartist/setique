-- Database Cleanup Analysis
-- Find tables that might be old/unused

-- 1. List ALL tables in the database
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE columns.table_schema = 'public' 
   AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check row counts for all tables to see which are empty/unused
-- (Run each of these separately to see data)

SELECT 'admins' as table_name, COUNT(*) as row_count FROM admins
UNION ALL
SELECT 'admin_activity_log', COUNT(*) FROM admin_activity_log
UNION ALL
SELECT 'bounties', COUNT(*) FROM bounties
UNION ALL
SELECT 'bounty_submissions', COUNT(*) FROM bounty_submissions
UNION ALL
SELECT 'creator_earnings', COUNT(*) FROM creator_earnings
UNION ALL
SELECT 'creator_payout_accounts', COUNT(*) FROM creator_payout_accounts
UNION ALL
SELECT 'curation_requests', COUNT(*) FROM curation_requests
UNION ALL
SELECT 'curator_proposals', COUNT(*) FROM curator_proposals
UNION ALL
SELECT 'curator_submissions', COUNT(*) FROM curator_submissions
UNION ALL
SELECT 'dataset_partnerships', COUNT(*) FROM dataset_partnerships
UNION ALL
SELECT 'datasets', COUNT(*) FROM datasets
UNION ALL
SELECT 'deletion_requests', COUNT(*) FROM deletion_requests
UNION ALL
SELECT 'download_logs', COUNT(*) FROM download_logs
UNION ALL
SELECT 'payout_requests', COUNT(*) FROM payout_requests
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'pro_curators', COUNT(*) FROM pro_curators
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL
SELECT 'request_messages', COUNT(*) FROM request_messages
UNION ALL
SELECT 'user_follows', COUNT(*) FROM user_follows
ORDER BY table_name;

-- 3. Check if bounties table is still referenced in code
-- (This is the OLD bounties table that should be deprecated)
SELECT * FROM bounties LIMIT 5;

-- 4. Check for empty/unused tables
-- Find tables with zero rows
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
