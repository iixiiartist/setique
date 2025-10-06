-- Comprehensive diagnostic for Pro Curator assigned requests visibility issue
-- Run these queries in order to diagnose the problem

-- 1. Check your Pro Curator profile
-- Replace 'YOUR_USER_EMAIL' with your actual test curator email
SELECT 
  pc.id as curator_id,
  pc.user_id,
  pc.display_name,
  pc.certification_status,
  u.email
FROM pro_curators pc
JOIN auth.users u ON u.id = pc.user_id
WHERE u.email ILIKE '%YOUR_EMAIL_PATTERN%'
ORDER BY pc.created_at DESC;

-- 2. Check all in_progress requests and their assigned curators
SELECT 
  cr.id as request_id,
  cr.title,
  cr.status,
  cr.assigned_curator_id,
  cr.creator_id,
  pc.display_name as assigned_curator_name,
  pc.user_id as curator_user_id
FROM curation_requests cr
LEFT JOIN pro_curators pc ON pc.id = cr.assigned_curator_id
WHERE cr.status = 'in_progress'
ORDER BY cr.created_at DESC;

-- 3. Check all proposals and their statuses
SELECT 
  cp.id as proposal_id,
  cp.status as proposal_status,
  cp.curator_id,
  cr.id as request_id,
  cr.title as request_title,
  cr.status as request_status,
  cr.assigned_curator_id,
  pc.display_name as curator_name,
  pc.user_id as curator_user_id
FROM curator_proposals cp
JOIN curation_requests cr ON cr.id = cp.request_id
JOIN pro_curators pc ON pc.id = cp.curator_id
ORDER BY cp.created_at DESC
LIMIT 10;

-- 4. Check if your curator ID matches the assigned_curator_id
-- Replace 'YOUR_CURATOR_ID' with the ID from query #1
SELECT 
  cr.id as request_id,
  cr.title,
  cr.status,
  cr.assigned_curator_id,
  CASE 
    WHEN cr.assigned_curator_id = 'YOUR_CURATOR_ID' THEN '✅ MATCH'
    ELSE '❌ NO MATCH'
  END as id_match,
  cp.id as proposal_id,
  cp.status as proposal_status
FROM curation_requests cr
LEFT JOIN curator_proposals cp ON cp.request_id = cr.id AND cp.curator_id = cr.assigned_curator_id
WHERE cr.status = 'in_progress';

-- 5. Test the exact query the frontend uses
-- Replace 'YOUR_CURATOR_ID' with the ID from query #1
SELECT 
  cr.*,
  p.username as requestor_username,
  p.avatar_url as requestor_avatar,
  json_agg(
    json_build_object(
      'id', cp.id,
      'proposal_text', cp.proposal_text,
      'estimated_completion_days', cp.estimated_completion_days,
      'suggested_price', cp.suggested_price,
      'status', cp.status,
      'created_at', cp.created_at
    )
  ) FILTER (WHERE cp.id IS NOT NULL) as curator_proposals
FROM curation_requests cr
LEFT JOIN profiles p ON p.id = cr.creator_id
LEFT JOIN curator_proposals cp ON cp.request_id = cr.id
WHERE cr.assigned_curator_id = 'YOUR_CURATOR_ID'
GROUP BY cr.id, p.username, p.avatar_url
ORDER BY cr.created_at DESC;

-- 6. Check RLS policies on curation_requests
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'curation_requests'
ORDER BY policyname;

-- 7. Check if there's a profiles record for the request creator
SELECT 
  cr.id as request_id,
  cr.title,
  cr.creator_id,
  p.id as profile_id,
  p.username,
  CASE 
    WHEN p.id IS NULL THEN '❌ MISSING PROFILE'
    ELSE '✅ HAS PROFILE'
  END as profile_status
FROM curation_requests cr
LEFT JOIN profiles p ON p.id = cr.creator_id
WHERE cr.status = 'in_progress';

-- 8. Final verification query - Shows everything needed for debugging
SELECT 
  'Request Info' as section,
  json_build_object(
    'request_id', cr.id,
    'title', cr.title,
    'status', cr.status,
    'assigned_curator_id', cr.assigned_curator_id,
    'creator_id', cr.creator_id
  ) as data
FROM curation_requests cr
WHERE cr.status = 'in_progress'

UNION ALL

SELECT 
  'Curator Info' as section,
  json_build_object(
    'curator_id', pc.id,
    'user_id', pc.user_id,
    'display_name', pc.display_name,
    'email', u.email
  ) as data
FROM pro_curators pc
JOIN auth.users u ON u.id = pc.user_id
WHERE pc.certification_status = 'approved'

UNION ALL

SELECT 
  'Proposal Info' as section,
  json_build_object(
    'proposal_id', cp.id,
    'request_id', cp.request_id,
    'curator_id', cp.curator_id,
    'status', cp.status
  ) as data
FROM curator_proposals cp
ORDER BY section;
