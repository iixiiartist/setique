-- Complete Admin Setup - Run this AFTER create_admin_system.sql
-- This makes user a9e799b2-3213-4e14-a9e5-6f5b5b9d3a92 a super admin

-- First, verify the admins table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admins'
) AS admins_table_exists;

-- If the above returns FALSE, you need to run create_admin_system.sql first!

-- Check if this user already exists as an admin
SELECT * FROM admins WHERE user_id = 'a9e799b2-3213-4e14-a9e5-6f5b5b9d3a92';

-- If no results above, insert the admin record
INSERT INTO admins (user_id, role, permissions, created_by)
VALUES (
  'a9e799b2-3213-4e14-a9e5-6f5b5b9d3a92',
  'super_admin',
  ARRAY['approve_curators', 'manage_users', 'manage_admins', 'view_analytics', 'handle_support', 'manage_datasets', 'manage_bounties'],
  'a9e799b2-3213-4e14-a9e5-6f5b5b9d3a92'
)
ON CONFLICT (user_id) DO UPDATE 
SET 
  role = 'super_admin',
  permissions = ARRAY['approve_curators', 'manage_users', 'manage_admins', 'view_analytics', 'handle_support', 'manage_datasets', 'manage_bounties'];

-- Verify the admin was created
SELECT 
  a.id,
  a.user_id,
  a.role,
  a.permissions,
  u.email,
  a.created_at
FROM admins a
JOIN auth.users u ON u.id = a.user_id
WHERE a.user_id = 'a9e799b2-3213-4e14-a9e5-6f5b5b9d3a92';

-- Test the admin check function
SELECT is_admin('a9e799b2-3213-4e14-a9e5-6f5b5b9d3a92') as is_user_admin;

-- If the above returns TRUE, you're all set! Go to /admin on your site
