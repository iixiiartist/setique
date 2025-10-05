-- STEP 5A: Recreate view policy (Run this sixth)
CREATE POLICY "Curation requests are viewable by everyone"
  ON curation_requests FOR SELECT
  USING (true);
