# Dataset Management Features

## Overview
Enhanced the Dashboard "My Datasets" tab with comprehensive dataset management capabilities. Users can now edit, delete, and manage their datasets directly from the dashboard.

## New Features

### 1. **Edit Dataset** ✏️
- Click the blue **Edit** button on any dataset
- Opens a modal with editable fields:
  - **Title** - Change dataset name
  - **Description** - Update dataset details
  - **Price** - Adjust pricing ($0+)
  - **Modality** - Change category (vision, audio, text, multimodal, other)
  - **Tags** - Add/remove comma-separated tags
- Changes save immediately to database
- Real-time UI update without page refresh

### 2. **Toggle Active/Inactive** 👁️
- Click the **Active/Inactive** badge to toggle visibility
- **Active** (green with eye icon) - Dataset visible in marketplace
- **Inactive** (gray with eye-off icon) - Dataset hidden from marketplace
- Useful for:
  - Temporarily removing datasets
  - Updating datasets without deleting
  - Managing inventory seasonally

### 3. **Delete Dataset** 🗑️
- Click the red **Trash** button
- **First click** - Shows confirmation warning
- **Second click** - Permanently deletes dataset
- **Safety Check** - Cannot delete datasets with purchases
  - If dataset has been purchased, delete is blocked
  - Shows alert: "Cannot delete dataset that has been purchased. Consider deactivating it instead."
  - Protects buyer access to purchased data

### 4. **Upload New Dataset** ⬆️
- Button in top-right of "My Datasets" tab
- Quick access to upload form
- Navigates to homepage curator section

### 5. **Enhanced Dataset Display** 📊
- Shows all key metrics:
  - 💰 Price
  - 📦 Modality
  - 🛒 Sales count
  - 📅 Creation date
- Displays tags as pills
- Visual status indicators

## UI Components

### Dataset Card (Before)
```
[Title]                    [Active Badge]
Description
💰 $10  📦 vision  🛒 5 sales  📅 1/1/2025
```

### Dataset Card (After)
```
[Title] [Active Badge ✓]           [Edit 📝] [Delete 🗑️]
Description
💰 $10  📦 vision  🛒 5 sales  📅 1/1/2025
[tag1] [tag2] [tag3]
```

### Edit Modal
```
┌─────────────────────────────────┐
│ Edit Dataset               [X]  │
├─────────────────────────────────┤
│ Title: [........................] │
│ Description:                     │
│ [............................] │
│ [............................] │
│                                  │
│ Price ($): [10.00]  Modality: [▼] │
│ Tags: [ml, cv, classification]   │
│                                  │
│ [Save Changes] [Cancel]         │
└─────────────────────────────────┘
```

## Technical Implementation

### New Icons
Added to `src/components/Icons.jsx`:
- **Edit** - Pencil icon for editing
- **Trash** - Trash can for deletion
- **Eye** - Visible/active status
- **EyeOff** - Hidden/inactive status
- **Upload** - Upload new dataset
- **X** - Close modal

### New State Variables
```javascript
const [editingDataset, setEditingDataset] = useState(null)
const [deleteConfirm, setDeleteConfirm] = useState(null)
const [actionLoading, setActionLoading] = useState(false)
```

### Handler Functions

#### `handleToggleActive(datasetId, currentStatus)`
- Toggles `is_active` field in database
- Updates local state optimistically
- Shows success/error alert

#### `handleEditDataset(dataset)`
- Opens edit modal with dataset data
- Pre-fills all fields
- Allows modification without navigation

#### `handleSaveEdit()`
- Validates edited fields
- Updates database via Supabase
- Refreshes local state
- Closes modal on success

#### `handleDeleteDataset(datasetId)`
- **First call:** Sets `deleteConfirm` to show warning
- **Second call:** Checks for purchases, then deletes
- Prevents deletion if dataset has sales
- Removes from local state on success

### Database Operations

**Toggle Active:**
```javascript
await supabase
  .from('datasets')
  .update({ is_active: !currentStatus })
  .eq('id', datasetId)
  .eq('creator_id', user.id)
```

**Edit Dataset:**
```javascript
await supabase
  .from('datasets')
  .update({
    title, description, price, modality, tags
  })
  .eq('id', datasetId)
  .eq('creator_id', user.id)
```

**Delete Dataset:**
```javascript
// Check for purchases first
const { data: purchases } = await supabase
  .from('purchases')
  .select('id')
  .eq('dataset_id', datasetId)
  .limit(1)

if (purchases.length > 0) {
  // Block deletion
} else {
  // Safe to delete
  await supabase
    .from('datasets')
    .delete()
    .eq('id', datasetId)
    .eq('creator_id', user.id)
}
```

## User Workflows

### Editing a Dataset
1. Navigate to Dashboard → My Datasets tab
2. Click blue **Edit** button on desired dataset
3. Modify fields in modal
4. Click **Save Changes**
5. Modal closes, changes reflected immediately

### Deactivating a Dataset
1. Navigate to Dashboard → My Datasets tab
2. Click green **Active** badge on dataset
3. Badge changes to gray **Inactive**
4. Dataset hidden from marketplace
5. Can reactivate anytime by clicking badge again

### Deleting a Dataset
1. Navigate to Dashboard → My Datasets tab
2. Click red **Trash** button
3. Warning appears: "Are you sure? Click delete again to confirm"
4. Click **Trash** button again to confirm
5. If no purchases: Dataset deleted permanently
6. If has purchases: Alert shown, delete blocked

### Uploading New Dataset
1. Navigate to Dashboard → My Datasets tab
2. Click **Upload New Dataset** button (top-right)
3. Redirected to homepage curator form
4. Fill form and submit
5. New dataset appears in "My Datasets"

## Safety Features

### Purchase Protection
- Cannot delete datasets that have been purchased
- Ensures buyers retain access to their purchases
- Suggests deactivating instead

### Two-Step Delete Confirmation
- First click shows warning
- Second click executes delete
- Prevents accidental deletions

### Creator Verification
- All operations check `creator_id`
- Users can only modify their own datasets
- Database RLS enforces additional security

### Loading States
- Buttons disable during operations
- Prevents duplicate submissions
- Shows "Saving..." feedback

## Benefits

### For Creators
✅ **Full Control** - Edit any field without re-uploading
✅ **Quick Updates** - Change price, description instantly
✅ **Inventory Management** - Toggle visibility on/off
✅ **Safety** - Cannot accidentally delete datasets with sales
✅ **Efficiency** - Manage everything from one page

### For Platform
✅ **Reduced Support** - Users self-serve editing
✅ **Data Integrity** - Purchase protection maintains buyer trust
✅ **Flexibility** - Creators keep datasets up-to-date
✅ **Better UX** - No need to contact support for edits

## Examples

### Example: Price Update
**Before:** Creator uploads dataset at $50, realizes too expensive
**After:** Click Edit → Change price to $25 → Save → Live immediately

### Example: Seasonal Management
**Before:** Creator has holiday-themed dataset, manually deletes after season
**After:** Click Active badge → Deactivates → Reactivate next year

### Example: Safe Deletion
**Before:** Creator deletes dataset, buyers lose access, angry support tickets
**After:** System blocks deletion, shows alert, suggests deactivation instead

## Files Modified

### `src/components/Icons.jsx`
- Added 6 new icons: Edit, Trash, Eye, EyeOff, Upload, X
- All follow existing Icon wrapper pattern
- Total: 19 icons available

### `src/pages/DashboardPage.jsx`
- Added 3 state variables for management
- Added 4 handler functions (toggle, edit, save, delete)
- Enhanced "My Datasets" tab with management UI
- Added Edit Modal component
- Import new icons
- ~150 lines added

## Future Enhancements

Potential improvements:
- [ ] Bulk operations (activate/deactivate multiple)
- [ ] Duplicate dataset feature
- [ ] Version history (track edits)
- [ ] Image upload for dataset thumbnails
- [ ] Drag-and-drop reordering
- [ ] Export dataset data
- [ ] Analytics per dataset (views, conversion rate)
- [ ] Schedule activation/deactivation dates

## Testing Checklist

Test these scenarios:
- [ ] Edit dataset → Save → Changes persist
- [ ] Toggle active → Dataset disappears from marketplace
- [ ] Toggle inactive → Dataset reappears
- [ ] Delete with no purchases → Success
- [ ] Delete with purchases → Blocked with alert
- [ ] Delete confirmation → First click shows warning
- [ ] Edit modal → Close button works
- [ ] Edit modal → Cancel button works
- [ ] Upload new dataset button → Navigates correctly
- [ ] Tags display and edit correctly

## Commit Info

**Files Changed:**
- `src/components/Icons.jsx` (+40 lines, 6 new icons)
- `src/pages/DashboardPage.jsx` (+150 lines, management features)
- `docs/DATASET_MANAGEMENT.md` (new documentation)

**Key Features:**
- Edit datasets (title, description, price, modality, tags)
- Toggle active/inactive status
- Delete with purchase protection
- Two-step confirmation for deletes
- Edit modal with validation
- Enhanced dataset display

## Conclusion

The Dataset Management feature provides creators with professional-grade tools to manage their inventory. The combination of editing, activation toggling, and safe deletion creates a complete management experience without leaving the dashboard.

**Impact:** Empowers creators to maintain high-quality, up-to-date datasets with minimal friction.
