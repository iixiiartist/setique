-- STEP 1A: Drop curation_requests policies (Run this first)
DROP POLICY IF EXISTS "Curation requests are viewable by everyone" ON curation_requests;
DROP POLICY IF EXISTS "Users can create their own curation requests" ON curation_requests;
DROP POLICY IF EXISTS "Requesters can update their own requests" ON curation_requests;
DROP POLICY IF EXISTS "Requesters can delete their own requests" ON curation_requests;
