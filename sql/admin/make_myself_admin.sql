-- Get your user ID and make yourself an admin
-- Run this in Supabase SQL Editor

-- Step 1: Find your user ID
-- Look for your email in the results
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Step 2: Copy your user ID from above and paste it below
-- Replace 'YOUR_USER_ID_HERE' with your actual UUID

-- INSERT INTO admins (user_id, role, permissions, created_by)
-- VALUES (
--   'YOUR_USER_ID_HERE',  -- ← Replace with your user ID from Step 1
--   'super_admin',
--   ARRAY['approve_curators', 'manage_users', 'manage_admins', 'view_analytics', 'handle_support', 'manage_datasets', 'manage_bounties'],
--   'YOUR_USER_ID_HERE'   -- ← Same ID here
-- );

-- Step 3: Verify you're an admin
-- SELECT * FROM admins WHERE user_id = 'YOUR_USER_ID_HERE';

-- Step 4: Test the admin check function
-- SELECT is_admin('YOUR_USER_ID_HERE');
