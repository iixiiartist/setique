-- Part 1: Drop Policies (Run this FIRST)
-- Copy and paste this into Supabase SQL Editor

DROP POLICY IF EXISTS "Curation requests are viewable by everyone" ON curation_requests;
DROP POLICY IF EXISTS "Users can create their own curation requests" ON curation_requests;
DROP POLICY IF EXISTS "Requesters can update their own requests" ON curation_requests;
DROP POLICY IF EXISTS "Requesters can delete their own requests" ON curation_requests;
DROP POLICY IF EXISTS "Proposals viewable by request owner and proposal curator" ON curator_proposals;
