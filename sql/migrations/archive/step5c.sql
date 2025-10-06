-- STEP 5C: Recreate update policy (Run this eighth)
CREATE POLICY "Requesters can update their own requests"
  ON curation_requests FOR UPDATE
  USING (auth.uid() = creator_id);
