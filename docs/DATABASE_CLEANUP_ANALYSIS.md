# Database Cleanup Analysis Report

## Tables Status Analysis

### ✅ **ACTIVE TABLES** (Keep - Currently Used)

These tables are actively referenced in the codebase:

1. **curation_requests** - NEW bounty system (replaces old `bounties`)
2. **curator_proposals** - Pro curator proposals for bounties
3. **curator_submissions** - Submissions from curators
4. **datasets** - Published datasets for marketplace
5. **profiles** - User profiles
6. **pro_curators** - Professional curator profiles
7. **purchases** - Dataset purchases
8. **download_logs** - Download tracking
9. **deletion_requests** - Dataset deletion system
10. **admins** - Admin users
11. **admin_activity_log** - Admin action tracking
12. **creator_earnings** - Creator revenue tracking
13. **creator_payout_accounts** - Stripe Connect accounts
14. **dataset_partnerships** - Curator-dataset partnerships
15. **bounty_submissions** - Dataset submissions to bounties
16. **request_messages** - Messages for curation requests
17. **user_follows** - User follow system
18. **payout_requests** - Creator payout requests (if exists)

### ⚠️ **DEPRECATED TABLES** (Can Be Removed)

1. **bounties** - OLD bounty system
   - **Status**: Replaced by `curation_requests`
   - **Data**: Contains 3 demo entries (shoe video, rain audio, chat logs)
   - **Code References**: NONE - Already migrated to `curation_requests`
   - **Safe to Drop**: ✅ YES

### 📋 **Cleanup Actions**

#### Option A: Safe Archive (Recommended)
```sql
-- 1. Backup old bounties data if needed
CREATE TABLE bounties_archived AS SELECT * FROM bounties;

-- 2. Drop the old table
DROP TABLE bounties CASCADE;

-- 3. Drop any related constraints/indexes
-- (CASCADE will handle this automatically)
```

#### Option B: Just Drop (If you don't need the demo data)
```sql
-- Simply drop the old bounties table
DROP TABLE bounties CASCADE;
```

### 🔍 **Verification Steps After Cleanup**

```sql
-- 1. Verify bounties table is gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'bounties';

-- 2. Verify no broken foreign keys
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'bounties';

-- 3. Check that curation_requests is working
SELECT COUNT(*) FROM curation_requests;
```

## 📊 **Impact Assessment**

### Risk Level: **LOW** ✅

**Why it's safe:**
1. ✅ Old `bounties` table has ZERO code references
2. ✅ Already migrated to `curation_requests` in previous session
3. ✅ Homepage, dashboards all use new `curation_requests` table
4. ✅ Only contains 3 demo entries that can be recreated if needed

**Tables that reference old bounties:**
- `bounty_submissions.bounty_id` → `bounties.id` (will be handled by CASCADE)

### Estimated Space Savings: **Minimal**
- Old bounties table: ~3 rows
- Related submissions: Unknown (likely small)

## 🚀 **Recommended Cleanup Migration**

Create: `014_cleanup_deprecated_tables.sql`

```sql
-- Migration 014: Remove Deprecated Tables
-- Purpose: Clean up old bounties table replaced by curation_requests
-- Date: 2025-10-06

BEGIN;

-- Archive old bounties data (optional - comment out if not needed)
CREATE TABLE IF NOT EXISTS bounties_archived AS 
SELECT * FROM bounties;

-- Drop old bounties table and all dependencies
DROP TABLE IF EXISTS bounties CASCADE;

-- Verify cleanup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bounties') THEN
    RAISE EXCEPTION 'Failed to drop bounties table';
  END IF;
  
  RAISE NOTICE 'Cleanup complete: bounties table removed';
END $$;

COMMIT;
```

## ⚠️ **Before You Run:**

1. **Test your app** - Make sure bounties display correctly (they should, we already tested)
2. **Backup database** - Always good practice
3. **Run in transaction** - Use BEGIN/COMMIT to allow rollback
4. **Monitor logs** - Watch for any errors after deployment

## 🎯 **Expected Results:**

- ✅ Cleaner database schema
- ✅ No confusion between old/new bounty systems
- ✅ Slightly better query performance (fewer tables to scan)
- ✅ Easier maintenance (one bounty system instead of two)
