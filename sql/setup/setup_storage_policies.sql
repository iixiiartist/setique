-- Storage RLS Policies for datasets bucket
-- Run this in Supabase SQL Editor

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (controlled by download system)
CREATE POLICY "Public can read dataset files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'datasets');
