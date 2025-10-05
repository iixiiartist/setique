-- STEP 1B: Drop curator_proposals policy (Run this second)
DROP POLICY IF EXISTS "Proposals viewable by request owner and proposal curator" ON curator_proposals;
