-- STEP 5B: Recreate insert policy (Run this seventh)
CREATE POLICY "Users can create their own curation requests"
  ON curation_requests FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
