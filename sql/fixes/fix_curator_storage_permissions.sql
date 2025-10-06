-- Fix Storage RLS Policies for Curator Submissions
-- Allows curators to upload submissions to their assigned requests

-- =====================================================
-- Storage Policies for curator-submissions folder
-- =====================================================

-- Policy 1: Allow curators to upload to curator-submissions folder
CREATE POLICY "Curators can upload submissions for assigned requests"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'datasets' 
  AND (storage.foldername(name))[1] = 'curator-submissions'
  AND auth.uid() IN (
    SELECT pc.user_id 
    FROM pro_curators pc
    JOIN curation_requests cr ON cr.assigned_curator_id = pc.id
    WHERE cr.id::text = (storage.foldername(name))[2]
  )
);

-- Policy 2: Allow curators to read their own submissions
CREATE POLICY "Curators can read their own submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'datasets' 
  AND (storage.foldername(name))[1] = 'curator-submissions'
  AND auth.uid() IN (
    SELECT pc.user_id 
    FROM pro_curators pc
    JOIN curation_requests cr ON cr.assigned_curator_id = pc.id
    WHERE cr.id::text = (storage.foldername(name))[2]
  )
);

-- Policy 3: Allow request owners to read submissions for their requests
CREATE POLICY "Request owners can read submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'datasets' 
  AND (storage.foldername(name))[1] = 'curator-submissions'
  AND auth.uid() IN (
    SELECT creator_id 
    FROM curation_requests 
    WHERE id::text = (storage.foldername(name))[2]
  )
);

-- =====================================================
-- Verification
-- =====================================================

-- List all storage policies on datasets bucket
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%curator%' OR policyname LIKE '%submission%';
