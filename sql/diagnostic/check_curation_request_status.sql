-- Diagnostic: Check curation request and proposal status
-- Run this to see what's happening with your requests

-- 1. Show all curation requests with their status
SELECT 
  id,
  title,
  status,
  assigned_curator_id,
  creator_id as requestor_user_id,
  created_at,
  updated_at
FROM curation_requests
ORDER BY created_at DESC
LIMIT 10;

-- 2. Show all proposals with their status
SELECT 
  cp.id as proposal_id,
  cp.status as proposal_status,
  cp.curator_id,
  cp.request_id,
  cr.title as request_title,
  cr.status as request_status,
  cr.assigned_curator_id,
  pc.user_id as curator_user_id,
  cp.created_at
FROM curator_proposals cp
JOIN curation_requests cr ON cr.id = cp.request_id
JOIN pro_curators pc ON pc.id = cp.curator_id
ORDER BY cp.created_at DESC
LIMIT 10;

-- 3. Check if there are any accepted proposals without assigned_curator_id
SELECT 
  cp.id as proposal_id,
  cp.status,
  cr.id as request_id,
  cr.title,
  cr.status as request_status,
  cr.assigned_curator_id,
  cp.curator_id
FROM curator_proposals cp
JOIN curation_requests cr ON cr.id = cp.request_id
WHERE cp.status = 'accepted'
  AND cr.assigned_curator_id IS NULL;

-- 4. Show Pro Curator IDs and their user IDs
SELECT 
  id as curator_id,
  user_id,
  certification_status
FROM pro_curators
ORDER BY created_at DESC;
