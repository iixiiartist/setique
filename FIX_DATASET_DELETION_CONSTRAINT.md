# Dataset Deletion Fix - Foreign Key Constraint Resolution

## Issue
Admin dataset deletion was failing with foreign key constraint error:
```
update or delete on table "datasets" violates foreign key constraint 
"purchases_dataset_id_fkey" on table "purchases"
```

## Root Cause
When attempting to delete a dataset that has been purchased by users, the database foreign key constraint prevented the deletion to preserve referential integrity and transaction history.

## Solution Implemented

### Smart Deletion Strategy
Implemented a **conditional deletion strategy** that automatically chooses between hard delete and soft delete:

#### Hard Delete (Permanent)
- **When**: Dataset has NO purchases
- **Action**: Permanently removes dataset and all related records
- **Cleanup Steps**:
  1. Clear `published_dataset_id` references in `curation_requests`
  2. Delete related `dataset_partnerships`
  3. Delete `dataset_reviews`
  4. Delete `comments`
  5. Delete `favorites`
  6. Delete the dataset record

#### Soft Delete (Deactivation)
- **When**: Dataset HAS purchases (1 or more)
- **Action**: Marks dataset as inactive, preserves all data
- **Updates**:
  - Sets `is_active = false`
  - Prefixes title with `[DELETED]`
  - Preserves all purchase records and transaction history

## Files Modified

### 1. `netlify/functions/admin-actions.js`
Updated two admin actions:

#### `delete_dataset` Action
```javascript
// Check purchase count
const { count: purchaseCount } = await supabase
  .from('purchases')
  .select('*', { count: 'exact', head: true })
  .eq('dataset_id', targetId)

if (purchaseCount > 0) {
  // Soft delete
  await supabase
    .from('datasets')
    .update({ 
      is_active: false,
      title: `[DELETED] ${originalTitle}`
    })
    .eq('id', targetId)
} else {
  // Hard delete with cleanup
  // ... cleanup steps ...
}
```

#### `approve_deletion_request` Action
Applied same logic to deletion request approvals, tracking deletion type in admin response.

### 2. `src/pages/AdminDashboard.jsx`
Updated UI to inform admins about the deletion strategy:
- Modified confirmation dialog message
- Added feedback for soft delete vs hard delete outcomes
- Shows purchase count for soft-deleted datasets

## Benefits

1. **Preserves Transaction History**: Purchase records remain intact for accounting and legal purposes
2. **Maintains Data Integrity**: Foreign key constraints are respected
3. **User Experience**: Buyers retain access to their purchased datasets even if deleted by admin
4. **Audit Trail**: Soft-deleted datasets remain in database with clear [DELETED] marker
5. **Flexibility**: Admins get appropriate feedback about deletion type
6. **Safety**: Prevents accidental data loss for datasets with financial transactions

## Database Impact

### Before Fix
- ❌ Deletion failed if purchases exist
- ❌ Error returned to admin
- ❌ No fallback strategy

### After Fix
- ✅ Automatic soft delete if purchases exist
- ✅ Clean hard delete if no purchases
- ✅ Clear feedback about deletion type
- ✅ Transaction history preserved

## Testing Recommendations

1. **Test Soft Delete**:
   - Create a dataset
   - Have a user purchase it
   - Admin deletes dataset
   - Verify: `is_active = false`, title prefixed with `[DELETED]`
   - Verify: Purchase record still exists
   - Verify: Buyer can still access dataset in their dashboard

2. **Test Hard Delete**:
   - Create a dataset
   - Do NOT purchase it
   - Admin deletes dataset
   - Verify: Dataset completely removed from database
   - Verify: All related records cleaned up

3. **Test Deletion Request Approval**:
   - Creator requests dataset deletion
   - Admin approves request
   - Verify: Appropriate deletion type applied
   - Verify: Admin response includes deletion type and purchase count

## Future Considerations

### Potential Enhancements
1. **Archive Table**: Move soft-deleted datasets to separate archive table
2. **Restore Function**: Add ability to restore soft-deleted datasets
3. **Expiration Policy**: Auto-cleanup soft-deleted datasets after X years
4. **Admin Dashboard Filter**: Show/hide deleted datasets in admin view
5. **Refund Integration**: Offer refunds when deleting purchased datasets

### Database Cleanup Query
To find soft-deleted datasets:
```sql
SELECT id, title, creator_id, created_at, 
       (SELECT COUNT(*) FROM purchases WHERE dataset_id = datasets.id) as purchase_count
FROM datasets 
WHERE is_active = false 
  AND title LIKE '[DELETED]%'
ORDER BY created_at DESC;
```

## Related Files
- `netlify/functions/admin-actions.js` - Backend deletion logic
- `src/pages/AdminDashboard.jsx` - Admin UI
- Database tables: `datasets`, `purchases`, `curation_requests`, `dataset_partnerships`, `dataset_reviews`, `comments`, `favorites`

## Date
October 16, 2025
