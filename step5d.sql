-- STEP 5D: Recreate delete policy (Run this ninth)
CREATE POLICY "Requesters can delete their own requests"
  ON curation_requests FOR DELETE
  USING (auth.uid() = creator_id);
