# Database Cleanup Migration 014 - Instructions

## 🎯 Purpose
Remove the deprecated `bounties` table and update `bounty_submissions` to reference the new `curation_requests` table.

## 📋 Pre-Migration Checklist

### 1. Verify Code Changes Deployed
Make sure the latest code is deployed that uses:
- ✅ `curation_requests` instead of `bounties` for all bounty queries
- ✅ `request_id` instead of `bounty_id` in bounty_submissions

### 2. Backup Database (Optional but Recommended)
From Supabase Dashboard:
1. Go to Settings > Database
2. Click "Create Backup" or download a manual backup

### 3. Test Current Functionality
Before migration, verify these work:
- [ ] Homepage shows active bounties
- [ ] User dashboard shows "My Bounties"
- [ ] Admin dashboard shows all bounties
- [ ] Dataset submission to bounties works

## 🚀 Run Migration

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your SETIQUE project
3. Click "SQL Editor" in the left sidebar

### Step 2: Copy and Run Migration
Copy the entire contents of:
```
supabase/migrations/014_cleanup_deprecated_tables.sql
```

Click "Run" button.

### Step 3: Watch for Success Messages
You should see:
```
NOTICE:  curation_requests has 1 rows
NOTICE:  bounty_submissions has X rows
NOTICE:  ✓ bounty_submissions now references curation_requests
NOTICE:  ✓ Cleanup successful: bounties table removed
```

### Step 4: Verify Results
The query at the end will show all remaining tables. Verify:
- ❌ `bounties` is NOT in the list
- ✅ `curation_requests` IS in the list
- ✅ `bounty_submissions` IS in the list

## 🔍 Post-Migration Verification

### 1. Test in Your App
After migration, test these features:
- [ ] Homepage "Active Bounties" displays correctly
- [ ] User can create a new bounty from dashboard
- [ ] User can submit dataset to bounty
- [ ] Submissions display correctly in "My Submissions"
- [ ] Admin dashboard shows bounties with correct data

### 2. Check Database Directly
Run these queries in SQL Editor:

```sql
-- Should return 0 rows (table doesn't exist)
SELECT COUNT(*) FROM bounties;  -- Should error

-- Should show data
SELECT COUNT(*) FROM curation_requests;

-- Should show request_id column (not bounty_id)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bounty_submissions'
ORDER BY column_name;
```

## ⚠️ Troubleshooting

### Error: "relation bounties does not exist"
**Good!** This means the table was successfully deleted. If you see this in your app, it means:
1. Some code still references the old `bounties` table
2. Re-deploy the latest code from GitHub

### Error: "column bounty_id does not exist"
**Expected after migration.** This means:
1. The column was renamed to `request_id`
2. Re-deploy the latest code that uses `request_id`

### Error: "violates foreign key constraint"
This means there's orphaned data. Run:
```sql
-- Find submissions without matching requests
SELECT bs.* 
FROM bounty_submissions bs
LEFT JOIN curation_requests cr ON bs.request_id = cr.id
WHERE cr.id IS NULL;

-- Clean up if needed
DELETE FROM bounty_submissions 
WHERE request_id NOT IN (SELECT id FROM curation_requests);
```

## 🎉 Success Indicators

After successful migration:
- ✅ No `bounties` table exists
- ✅ `bounty_submissions` uses `request_id` column
- ✅ `bounty_submissions.request_id` references `curation_requests.id`
- ✅ All bounty features work correctly in the app
- ✅ No console errors related to bounties

## 📊 What Changed

### Database Schema
**Before:**
```sql
bounties (id, title, budget, ...) -- OLD TABLE
bounty_submissions (bounty_id -> bounties.id)
curation_requests (id, title, budget_min, budget_max, ...)
```

**After:**
```sql
-- bounties table removed ❌
bounty_submissions (request_id -> curation_requests.id) -- UPDATED
curation_requests (id, title, budget_min, budget_max, ...)
```

### Code Changes
**Before:**
```javascript
.from('bounty_submissions')
.select('*, bounties(*)')
.eq('bounty_id', id)
.insert({ bounty_id: id })
```

**After:**
```javascript
.from('bounty_submissions')
.select('*, curation_requests!request_id(*)')
.eq('request_id', id)
.insert({ request_id: id })
```

## 🔄 Rollback (If Needed)

If something goes wrong, you can rollback by:

1. Re-create the bounties table:
```sql
CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id),
  title TEXT,
  description TEXT,
  budget DECIMAL(10,2),
  modality TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. Revert bounty_submissions:
```sql
ALTER TABLE bounty_submissions RENAME COLUMN request_id TO bounty_id;
ALTER TABLE bounty_submissions DROP CONSTRAINT bounty_submissions_request_id_fkey;
ALTER TABLE bounty_submissions ADD CONSTRAINT bounty_submissions_bounty_id_fkey
  FOREIGN KEY (bounty_id) REFERENCES bounties(id);
```

3. Re-deploy previous code version

---

**Need Help?** If you encounter any issues during migration, check:
1. Supabase SQL Editor error messages
2. Browser console for JavaScript errors
3. Netlify deployment logs
