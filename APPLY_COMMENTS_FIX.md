# Comments System - Database Fix Required

**Date**: October 14, 2025  
**Issue**: Comments failing to load due to database schema mismatch  
**Status**: ⚠️ **URGENT - Database migration required**

---

## 🐛 Problem

The comments system is showing this error:
```
Failed to load comments
column p.is_pro_curator does not exist
```

**Root Cause**: The SQL functions were checking for `profiles.is_pro_curator` column, but Pro Curator status is stored in a separate `pro_curators` table.

---

## ✅ Solution

A fix migration has been created that updates the 3 RPC functions to use the correct pro curator check.

**File**: `sql/migrations/20251014_fix_comments_pro_curator.sql`

---

## 📋 How to Apply the Fix

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your SETIQUE project
3. Navigate to **SQL Editor**

### Step 2: Run the Fix Migration
1. Click **New Query**
2. Open the file: `sql/migrations/20251014_fix_comments_pro_curator.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Success
You should see:
```
Success. No rows returned
```

If you see any errors, copy the full error message and review.

---

## 🔧 What This Fix Does

Updates 3 database functions:

1. **`add_dataset_comment()`**
   - Changes: `p.is_pro_curator` → `EXISTS(SELECT 1 FROM pro_curators pc WHERE pc.id = c.user_id)`
   - Effect: Correctly checks if user is a Pro Curator

2. **`get_dataset_comments()`**
   - Changes: Same pro curator lookup fix
   - Effect: Comments list shows correct Pro Curator badges

3. **`get_comment_replies()`**
   - Changes: Same pro curator lookup fix
   - Effect: Reply threads show correct Pro Curator badges

---

## ✨ UI Improvements (Already Deployed)

The following UI changes were also pushed in this commit:

### 2-Column Layout
- Dataset details on the **left** (50% width)
- Comments section on the **right** (50% width)
- Modal width increased to `max-w-6xl`
- Scrollable content with `max-h-[90vh]`

### Compact Comment Styling
- Smaller cards: `border-2` instead of `border-4`
- Reduced padding: `p-3` instead of `p-4`
- Smaller fonts: `text-xs` and `text-sm`
- Smaller avatars: `w-8 h-8` instead of `w-10 h-10`
- Tighter spacing: `mb-3` instead of `mb-4`

### Benefits
- ✅ Dataset info always visible
- ✅ Comments don't overwhelm the modal
- ✅ Better information density
- ✅ Easier to scan multiple comments

---

## 🧪 Testing After Fix

Once you apply the migration, test these scenarios:

### 1. View Comments
- [ ] Open any dataset modal
- [ ] Comments section should load without errors
- [ ] Pro Curator badges should display correctly

### 2. Add Comment
- [ ] Type a comment
- [ ] Click "Post Comment"
- [ ] Comment should appear immediately
- [ ] Activity feed should log the comment

### 3. Reply to Comment
- [ ] Click reply on any comment
- [ ] Type a reply
- [ ] Submit
- [ ] Reply should nest under parent comment

### 4. Edit Comment
- [ ] Click edit on your own comment (within 15 minutes)
- [ ] Modify text
- [ ] Save
- [ ] Should show "(edited)" indicator

### 5. Delete Comment
- [ ] Click delete on your own comment
- [ ] Confirm deletion
- [ ] Comment should disappear
- [ ] Comment count should decrement

---

## 📊 Expected Behavior After Fix

### Loading Comments
```
✅ Comments section loads
✅ Shows comment count
✅ Real-time updates work
✅ Pro Curator badges display correctly
```

### Comment Display
```
✅ User avatars and names
✅ Timestamps (e.g., "2 hours ago")
✅ Pro Curator "PRO" badge
✅ Reply count indicator
✅ Edit/delete/reply actions
```

### Adding Comments
```
✅ Form validation works
✅ Character counter accurate
✅ Submit button enables/disables correctly
✅ Comment appears after posting
✅ Activity feed logs the action
```

---

## 🚨 If Issues Persist

### Check RPC Function Existence
Run this query in Supabase SQL Editor:
```sql
SELECT 
    'add_dataset_comment' as function,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'add_dataset_comment') as exists
UNION ALL
SELECT 
    'get_dataset_comments' as function,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_dataset_comments') as exists
UNION ALL
SELECT 
    'get_comment_replies' as function,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_comment_replies') as exists;
```

All should return `true`.

### Check Table Structure
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dataset_comments';
```

Should include: `id`, `dataset_id`, `user_id`, `parent_comment_id`, `content`, `created_at`, `is_deleted`, etc.

### Check Pro Curators Table
```sql
SELECT COUNT(*) FROM pro_curators;
```

Should return number of pro curators (may be 0 if none exist yet).

---

## 📞 Support

If you encounter issues:
1. Copy the full error message from console
2. Check Supabase logs (Database → Logs)
3. Verify migration was applied successfully
4. Test with a fresh browser session (clear cache)

---

## 🎯 Summary

**Before Fix**:
- ❌ Comments fail to load
- ❌ Error: "column p.is_pro_curator does not exist"
- ❌ Cannot post or view comments

**After Fix**:
- ✅ Comments load correctly
- ✅ Pro Curator badges display
- ✅ Full comment functionality works
- ✅ Compact, beautiful UI

**Action Required**: Apply the migration file to Supabase SQL Editor

---

**Git Commit**: `6ed2907`  
**Files Changed**: 4 files, +364 lines, -101 lines  
**Migration File**: `sql/migrations/20251014_fix_comments_pro_curator.sql`
