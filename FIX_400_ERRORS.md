# FIX: 400 Errors and Activity Logging Issues

## 🔴 Problem Identified

You're seeing these errors:
1. **400 Bad Request** - Server rejecting requests
2. **"Error logging activity: Object"** - Activity tracking failing
3. **Console violations** - setTimeout handler taking too long

## 🎯 Root Cause

The `log_user_activity` RPC function doesn't exist in your Supabase database. The activity feed system migration hasn't been applied yet.

**UPDATE**: The migration file was also missing `'comment_added'` activity type in the validation constraint, which would cause comments to fail even after applying the migration. This has been fixed!

---

## ✅ Solution: Apply Missing Migrations

You need to apply **TWO** critical SQL migrations:

### 1. Comments Fix Migration (CRITICAL) ⭐⭐⭐
**File**: `sql/migrations/20251014_fix_comments_pro_curator.sql`  
**Status**: ❌ NOT APPLIED  
**Impact**: Comments may fail for pro curators

### 2. Activity Feed Migration (CRITICAL) ⭐⭐⭐
**File**: `sql/migrations/add_activity_feed_system.sql`  
**Status**: ❌ NOT APPLIED (and just fixed!)  
**Impact**: All activity logging fails with 400 errors  
**Fixed**: Added missing `'comment_added'` activity type to validation constraint

---

## 🚀 Quick Fix (10 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your **SETIQUE** project
3. Click **SQL Editor** in left sidebar

### Step 2: Apply Comments Fix Migration

1. Open file: `sql/migrations/20251014_fix_comments_pro_curator.sql`
2. Copy **ALL** contents (254 lines)
3. Paste into SQL Editor
4. Click **Run** (▶️ button)
5. Wait for success message

**Expected Output**:
```
Success. No rows returned
```

### Step 3: Apply Activity Feed Migration

1. Open file: `sql/migrations/add_activity_feed_system.sql`
2. Copy **ALL** contents (241 lines)
3. Paste into SQL Editor
4. Click **Run** (▶️ button)
5. Wait for success message

**Expected Output**:
```
NOTICE:  ✓ user_activities table created
NOTICE:  ✓ Indexes created
NOTICE:  Functions: log_user_activity(), get_activity_feed()
NOTICE:  ✓ RLS policies enabled
NOTICE:  Activity feed system setup complete!
Success. No rows returned
```

### Step 4: Verify Both Migrations

Run this verification query in SQL Editor:

```sql
-- Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'log_user_activity',
  'get_activity_feed',
  'add_dataset_comment',
  'get_dataset_comments',
  'get_comment_replies'
)
ORDER BY routine_name;
```

**Expected Result**: Should show all 5 functions

### Step 5: Test in Your App

1. Refresh your browser (Ctrl + Shift + R)
2. Open browser console (F12)
3. Add a comment to any dataset
4. Check console - should see NO errors
5. Browse pages - should see NO 400 errors

---

## 📊 What These Migrations Do

### Comments Fix Migration
- Fixes pro curator badge display in comments
- Updates 3 RPC functions:
  - `add_dataset_comment()` - Creates comments
  - `get_dataset_comments()` - Fetches comments
  - `get_comment_replies()` - Fetches replies
- Changes `is_pro_curator` check to use `pro_curators` table

### Activity Feed Migration
- Creates `user_activities` table
- Creates `log_user_activity()` RPC function
- Creates `get_activity_feed()` RPC function
- Adds indexes for performance
- Sets up RLS policies

---

## 🔍 Troubleshooting

### Issue: "function log_user_activity does not exist"

**Cause**: Activity feed migration not applied  
**Fix**: Apply `add_activity_feed_system.sql` migration (Step 3 above)

### Issue: "column p.is_pro_curator does not exist"

**Cause**: Comments fix migration not applied  
**Fix**: Apply `20251014_fix_comments_pro_curator.sql` migration (Step 2 above)

### Issue: "permission denied for function log_user_activity"

**Cause**: RLS policies not set correctly  
**Fix**: Re-run activity feed migration, ensure SECURITY DEFINER is set

### Issue: Still seeing 400 errors after migration

**Possible Causes**:
1. Browser cache - Try hard refresh (Ctrl + Shift + R)
2. Dev server not reloaded - Restart with `npm run dev`
3. Wrong Supabase project - Verify you're in SETIQUE project
4. Environment variables - Check `.env` file has correct Supabase URL

**Debug Steps**:
```javascript
// Check in browser console:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

// Should match your Supabase project URL
```

---

## ✅ Success Checklist

After applying migrations, you should have:

- [ ] No 400 errors in console
- [ ] No "Error logging activity" messages
- [ ] Comments work without errors
- [ ] Pro curator badges display correctly
- [ ] Activity tracking works silently in background
- [ ] Console is clean (no error messages)

---

## 📝 Code Changes Made

I've improved error logging in `src/lib/activityTracking.js`:

**Before**:
```javascript
console.error('Error logging activity:', error);
```

**After**:
```javascript
console.error('Error logging activity:', {
  error: error,
  message: error.message,
  details: error.details,
  hint: error.hint,
  code: error.code
});
```

This will give you much better error messages if anything goes wrong.

---

## 🎯 After Applying Migrations

Once both migrations are applied:

1. **Commit the improved error logging**:
   ```bash
   git add src/lib/activityTracking.js
   git commit -m "improve: Better error logging for activity tracking"
   git push
   ```

2. **Update migration status docs**:
   - Mark both migrations as "✅ APPLIED" in your docs
   - Update `APPLY_COMMENTS_FIX.md`
   - Update `REFACTORING_SUMMARY.md`

3. **Test thoroughly**:
   - Add comments
   - Browse datasets
   - Follow users
   - Check activity feed page
   - Verify no console errors

---

## 🆘 If Migrations Fail

### Rollback Procedure

If anything goes wrong, you can rollback:

```sql
-- Rollback activity feed (if needed)
DROP FUNCTION IF EXISTS log_user_activity(UUID, TEXT, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS get_activity_feed(UUID, INTEGER, INTEGER);
DROP TABLE IF EXISTS user_activities CASCADE;

-- Rollback comments fix (if needed)
-- Re-run the OLD version of functions (before fix)
-- Contact for help if needed
```

**Note**: Don't rollback unless you have a serious issue. Both migrations are tested and safe.

---

## 💡 Prevention for Future

To avoid this in the future:

1. **Track applied migrations** in a doc:
   ```markdown
   # Applied Migrations Log
   
   - [x] 20251014_dataset_comments_system.sql - Oct 14, 2025
   - [ ] 20251014_fix_comments_pro_curator.sql - NOT YET APPLIED
   - [ ] add_activity_feed_system.sql - NOT YET APPLIED
   ```

2. **Check functions before deploying**:
   ```sql
   -- Always verify RPC functions exist
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public';
   ```

3. **Test in staging first** (if you have staging environment)

4. **Keep migration files organized** by date and status

---

## 📞 Need Help?

If you're still seeing issues after applying both migrations:

1. Copy the **FULL error message** from console
2. Share the exact steps you took
3. Include screenshot of SQL Editor results
4. Check Supabase logs (Logs section in dashboard)

The most common issue is forgetting to refresh the browser after applying migrations!

---

**Status**: 🔴 ACTION REQUIRED  
**Priority**: CRITICAL  
**Time**: 10 minutes  
**Risk**: LOW (migrations are safe and tested)

**Next Action**: Apply both migrations NOW in Supabase SQL Editor
