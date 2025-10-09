-- Quick verification that beta access system is fully operational
SELECT 
  'Beta Access Table' as component,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'beta_access') 
    THEN '✓ Exists' 
    ELSE '✗ Missing' 
  END as status;

-- Check RLS is enabled
SELECT 
  'Row Level Security' as component,
  CASE WHEN relrowsecurity THEN '✓ Enabled' ELSE '✗ Disabled' END as status
FROM pg_class 
WHERE relname = 'beta_access';

-- Count policies
SELECT 
  'RLS Policies' as component,
  COUNT(*)::text || ' policies' as status
FROM pg_policies 
WHERE tablename = 'beta_access';

-- Count functions
SELECT 
  'Database Functions' as component,
  COUNT(*)::text || ' functions' as status
FROM information_schema.routines 
WHERE routine_name IN (
  'generate_access_code',
  'create_beta_access_on_signup',
  'has_beta_access',
  'admin_approve_beta_user',
  'admin_reject_beta_user',
  'redeem_access_code',
  'update_beta_access_updated_at'
) AND routine_schema = 'public';

-- Check triggers
SELECT 
  'Database Triggers' as component,
  COUNT(*)::text || ' triggers' as status
FROM information_schema.triggers 
WHERE event_object_table = 'beta_access' 
   OR (event_object_table = 'profiles' AND trigger_name = 'trigger_create_beta_access');

-- Check indexes
SELECT 
  'Table Indexes' as component,
  COUNT(*)::text || ' indexes' as status
FROM pg_indexes 
WHERE tablename = 'beta_access';
