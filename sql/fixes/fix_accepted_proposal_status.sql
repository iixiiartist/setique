-- Fix proposal status for requests that are in_progress but proposal is still pending
-- This fixes the data inconsistency where the request was marked as assigned
-- but the proposal wasn't marked as accepted

-- First, let's see the problem
SELECT 
  cr.id as request_id,
  cr.title,
  cr.status as request_status,
  cr.assigned_curator_id,
  cp.id as proposal_id,
  cp.status as proposal_status,
  cp.curator_id
FROM curation_requests cr
JOIN curator_proposals cp ON cp.request_id = cr.id AND cp.curator_id = cr.assigned_curator_id
WHERE cr.status = 'in_progress'
  AND cr.assigned_curator_id IS NOT NULL
  AND cp.status != 'accepted';

-- Now fix it: Update the proposal to 'accepted' where the request is in_progress
-- and the proposal's curator_id matches the assigned_curator_id
UPDATE curator_proposals
SET status = 'accepted', updated_at = NOW()
WHERE id IN (
  SELECT cp.id
  FROM curator_proposals cp
  JOIN curation_requests cr ON cr.id = cp.request_id
  WHERE cr.status = 'in_progress'
    AND cr.assigned_curator_id IS NOT NULL
    AND cp.curator_id = cr.assigned_curator_id
    AND cp.status != 'accepted'
);

-- Also reject other proposals for these requests
UPDATE curator_proposals
SET status = 'rejected', updated_at = NOW()
WHERE request_id IN (
  SELECT cr.id
  FROM curation_requests cr
  WHERE cr.status = 'in_progress'
    AND cr.assigned_curator_id IS NOT NULL
)
AND curator_id != (
  SELECT assigned_curator_id 
  FROM curation_requests 
  WHERE id = curator_proposals.request_id
)
AND status = 'pending';

-- Verify the fix
SELECT 
  cr.id as request_id,
  cr.title,
  cr.status as request_status,
  cr.assigned_curator_id,
  cp.id as proposal_id,
  cp.status as proposal_status,
  cp.curator_id
FROM curation_requests cr
JOIN curator_proposals cp ON cp.request_id = cr.id
WHERE cr.status = 'in_progress'
  AND cr.assigned_curator_id IS NOT NULL
ORDER BY cp.status;
