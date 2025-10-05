-- STEP 5E: Recreate proposals policy (Run this LAST - tenth)
CREATE POLICY "Proposals viewable by request owner and proposal curator"
  ON curator_proposals FOR SELECT
  USING (
    auth.uid() IN (
      SELECT creator_id FROM curation_requests WHERE id = request_id
    ) OR
    auth.uid() IN (
      SELECT user_id FROM pro_curators WHERE id = curator_id
    )
  );
