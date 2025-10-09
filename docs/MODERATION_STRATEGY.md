# Dataset Moderation Strategy

## Current State
- `is_published` column exists (added in migration 018)
- `is_active` column exists (original schema)
- No moderation workflow currently in place

## Proposed Multi-Tier Moderation System

### Tier 1: Trusted Users (Auto-Approve) ⚡
**For:** Verified creators, Pro Curators, users with proven track record
**Experience:** Instant publication
**How:** 
- Add `trust_level` to profiles (0=new, 1=verified, 2=trusted, 3=pro)
- Auto-set `is_published=true` for trust_level >= 2
- No delay in user experience

### Tier 2: Auto-Moderation (Instant Check) 🤖
**For:** All uploads
**Experience:** Instant feedback (<1 second)
**How:**
- Content scanning for prohibited keywords
- File type validation
- Price reasonableness checks
- Flag suspicious patterns
- If passes: auto-publish (trust_level 1)
- If flagged: hold for review (trust_level 0)

### Tier 3: Human Review Queue (Background) 👥
**For:** Flagged content, new users, first 3 uploads
**Experience:** Non-blocking
**How:**
- Upload succeeds immediately
- Dataset visible to creator but not marketplace
- Admin reviews within 24 hours
- Creator gets notification when approved
- Can edit/resubmit if rejected

### Tier 4: Community Reporting 🚩
**For:** Post-publication moderation
**Experience:** Transparent
**How:**
- Report button on all datasets
- Auto-unpublish after 3 reports (pending review)
- Admin investigates
- False reporters lose trust_level

## Implementation Plan

### Phase 1: Add Moderation Fields (NOW)
```sql
ALTER TABLE datasets ADD COLUMN moderation_status TEXT DEFAULT 'pending';
-- Values: 'pending', 'approved', 'rejected', 'flagged'

ALTER TABLE datasets ADD COLUMN moderation_notes TEXT;
ALTER TABLE datasets ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE datasets ADD COLUMN moderated_by UUID REFERENCES profiles(id);

ALTER TABLE profiles ADD COLUMN trust_level INTEGER DEFAULT 0;
-- 0=new (needs review), 1=verified (auto-approve), 2=trusted (skip review), 3=pro

-- Set existing users to verified
UPDATE profiles SET trust_level = 1 WHERE created_at < NOW() - INTERVAL '7 days';
```

### Phase 2: Auto-Moderation Rules (Quick Win)
- Keyword blocklist (profanity, illegal content)
- Price validation (not >$10,000)
- File size limits (already exists)
- Title/description length checks
- Suspicious pattern detection

### Phase 3: Admin Dashboard (Week 2)
- Review queue page
- Bulk approve/reject
- User trust_level management
- Moderation history log

### Phase 4: Advanced AI Moderation (Future)
- OpenAI Moderation API for text content
- Computer vision for sample data
- Spam detection ML model

## Recommended Starting Point

### Immediate Solution (No Development Needed)
1. Set all existing creators to `trust_level = 1` (verified)
2. New uploads: `is_published = false`, `moderation_status = 'pending'`
3. Admin manually reviews and sets `is_published = true`
4. Add simple admin page to review queue

### Balanced Approach (Best UX)
1. **First 3 uploads:** Manual review (24hr SLA)
2. **After 3 approved:** Auto-publish (trust_level = 1)
3. **After 10 approved:** Skip all checks (trust_level = 2)
4. **Pro Curators:** Instant publish (trust_level = 3)

### Metrics to Track
- Average review time
- False positive rate (good content rejected)
- False negative rate (bad content published)
- User complaints per 1000 datasets
- Trust_level distribution

## Database Changes Required

```sql
-- Migration: Add moderation system
BEGIN;

-- Add moderation columns to datasets
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Add trust level to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trust_level INTEGER DEFAULT 0;

-- Set existing users as verified (grandfather them in)
UPDATE profiles 
SET trust_level = 1 
WHERE created_at < NOW() - INTERVAL '7 days' 
   OR id IN (SELECT DISTINCT creator_id FROM datasets WHERE purchase_count > 0);

-- Set existing datasets as approved
UPDATE datasets 
SET moderation_status = 'approved', 
    moderated_at = NOW()
WHERE is_published = true;

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'approved', 'rejected', 'flagged', 'reported'
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dataset_reports table
CREATE TABLE IF NOT EXISTS dataset_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dataset_id, reporter_id) -- One report per user per dataset
);

-- Create indexes
CREATE INDEX idx_datasets_moderation_status ON datasets(moderation_status);
CREATE INDEX idx_datasets_report_count ON datasets(report_count);
CREATE INDEX idx_profiles_trust_level ON profiles(trust_level);
CREATE INDEX idx_moderation_logs_dataset ON moderation_logs(dataset_id);
CREATE INDEX idx_dataset_reports_status ON dataset_reports(status);

-- Add RLS policies
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_reports ENABLE ROW LEVEL SECURITY;

-- Admins can see all moderation logs
CREATE POLICY "Admins can view all moderation logs"
  ON moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.trust_level >= 3
    )
  );

-- Anyone can report datasets
CREATE POLICY "Users can create reports"
  ON dataset_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON dataset_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON dataset_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.trust_level >= 3
    )
  );

-- Admins can update reports
CREATE POLICY "Admins can update reports"
  ON dataset_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.trust_level >= 3
    )
  );

COMMIT;
```

## Frontend Changes Needed

### 1. Dataset Upload Flow
- Check user trust_level
- If trust_level >= 2: Auto-publish
- If trust_level == 1: Basic validation, then publish
- If trust_level == 0: Hold for review, show "Under Review" message

### 2. Creator Dashboard
- Show moderation status for each dataset
- "Under Review" badge for pending datasets
- Notification when approved/rejected

### 3. Report Button Component
```jsx
// Add to dataset detail modals
<ReportButton datasetId={dataset.id} />
```

### 4. Admin Dashboard Page
- Queue of pending datasets
- User trust_level management
- Reports queue
- Quick approve/reject actions

## Benefits of This Approach

✅ **No User Friction** for trusted users (auto-publish)
✅ **Fast Review** for new users (24hr SLA)
✅ **Scalable** (auto-moderation + trust system)
✅ **Transparent** (users see status)
✅ **Community-Powered** (reporting system)
✅ **Audit Trail** (moderation logs)
✅ **Gradual Trust** (earn auto-approval)

## Risk Mitigation

1. **Malicious Upload:** Caught by keyword scan or manual review
2. **Spam:** Rate limiting + trust_level gates
3. **Inappropriate Content:** Community reports + admin review
4. **False Positives:** Appeal process for rejected uploads
5. **Slow Reviews:** SLA tracking + auto-approve after 48hrs

## Recommended Next Steps

1. ✅ **Implement database migration** (above SQL)
2. ✅ **Add trust_level display** to admin dashboard
3. ✅ **Create simple review queue** page for admins
4. ⏳ **Add moderation status** to dataset cards
5. ⏳ **Build report button** component
6. ⏳ **Add upload validation** logic
7. ⏳ **Implement email notifications** for status changes
