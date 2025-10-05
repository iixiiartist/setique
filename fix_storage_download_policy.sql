-- Fix Storage RLS policies for proper download access
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read dataset files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read dataset files" ON storage.objects;

-- Allow authenticated users to read all files in datasets bucket
-- (Service role used by Netlify function needs this)
CREATE POLICY "Anyone can read dataset files"
ON storage.objects FOR SELECT
USING (bucket_id = 'datasets');
