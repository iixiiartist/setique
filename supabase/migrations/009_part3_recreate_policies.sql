-- Part 3: Recreate Policies (Run this THIRD - LAST STEP)
-- Copy and paste this into Supabase SQL Editor

-- Curation Requests Policies
CREATE POLICY "Curation requests are viewable by everyone"
  ON curation_requests FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own curation requests"
  ON curation_requests FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Requesters can update their own requests"
  ON curation_requests FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Requesters can delete their own requests"
  ON curation_requests FOR DELETE
  USING (auth.uid() = creator_id);

-- Curator Proposals Policy
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
