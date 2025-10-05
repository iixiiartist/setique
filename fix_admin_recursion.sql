-- Fix Infinite Recursion in Admin Policies
-- Run this in Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;

-- Create simpler policies that don't cause recursion
-- Allow authenticated users to check if they themselves are an admin
CREATE POLICY "Users can view their own admin status"
  ON admins FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role (backend) to manage admins
-- This prevents recursion since it doesn't check the admins table
CREATE POLICY "Service role can manage admins"
  ON admins FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Also fix the pro_curators policies to not cause recursion
DROP POLICY IF EXISTS "Pro curators are viewable by admins and public if approved" ON pro_curators;
DROP POLICY IF EXISTS "Admins can update pro curator certification status" ON pro_curators;

-- Create simpler policies
CREATE POLICY "Approved curators are viewable by everyone"
  ON pro_curators FOR SELECT
  USING (certification_status = 'approved');

CREATE POLICY "Pending and rejected curators viewable by themselves"
  ON pro_curators FOR SELECT
  USING (auth.uid() = user_id);

-- For admin updates, we'll use a Netlify function with service role key instead
-- This avoids RLS recursion completely

-- Verify policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('admins', 'pro_curators')
ORDER BY tablename, policyname;
