# Phase 6: Custom Hooks Extraction - Implementation Plan

**Status**: 🚀 READY TO START  
**Created**: January 2025  
**Estimated Time**: 3-4 hours  
**Risk Level**: MEDIUM  
**Expected Reduction**: 350-400 lines (27-33% of DashboardPage.jsx)

---

## 📋 Executive Summary

Phase 6 extracts business logic from `DashboardPage.jsx` into reusable custom hooks, separating data fetching, state management, and action handlers from UI rendering. This improves code reusability, testability, and maintainability.

### Current State
- **File**: `src/pages/DashboardPage.jsx`
- **Current Lines**: 1,531 lines (after Phase 5)
- **Business Logic**: ~450 lines of hooks and handlers mixed with UI
- **Pain Points**:
  - 300-line `fetchDashboardData` function (lines 111-408)
  - 7 dataset action handlers (~150 lines)
  - 3 bounty action handlers (~100 lines)
  - Stripe Connect logic (~40 lines)
  - 15+ useState declarations
  - Difficult to test logic in isolation

### Target State
- **Expected Lines**: 1,131-1,181 lines (27-33% reduction)
- **Lines Removed**: 350-400 lines
- **Custom Hooks Created**: 4 hooks
- **Benefits**:
  - Data fetching logic portable and reusable
  - Action handlers testable in isolation
  - Cleaner component structure
  - Easier to add features
  - Better separation of concerns

---

## 🎯 Hooks to Extract

### 1. **useDashboardData** (Highest Priority)
**File**: `src/lib/hooks/useDashboardData.js`  
**Lines Extracted**: ~320 lines (fetchDashboardData + useState declarations)  
**Complexity**: HIGH

**Purpose**: Centralize all dashboard data fetching logic.

**Current Code Location**: Lines 111-408 (fetchDashboardData) + lines 62-90 (useState)

**API Design**:
```javascript
const {
  // Loading & Error States
  loading,
  error,
  
  // Data Objects
  data: {
    // Curator Data
    myDatasets,           // User's created datasets with partnerships
    earnings,             // Earnings summary (total, pending, paid, transactions)
    payoutAccount,        // Stripe Connect payout account
    
    // Buyer Data
    myPurchases,          // User's purchased datasets
    myFavorites,          // User's favorited datasets
    
    // Bounty Data
    myBounties,           // User's posted bounties with proposals
    mySubmissions,        // User's bounty submissions
    
    // Curation Data
    myCurationRequests,   // User's curation requests with proposals
    openCurationRequests, // All open requests (marketplace)
    curatorProfile,       // Pro curator profile if exists
    curatorAssignedRequests, // Requests assigned to curator
    
    // Admin Data
    deletionRequests,     // User's deletion requests
    isAdmin,              // Admin status flag
    hasModerationAccess,  // Moderation access flag
  },
  
  // Actions
  refetch,                // Manual refetch function
} = useDashboardData(user, profile)
```

**Implementation Notes**:
- Accept `user` and `profile` as parameters
- Use internal useState for all data states
- Use useCallback for fetchDashboardData
- Use useEffect to trigger initial fetch
- Handle Stripe onboarding completion check
- Return loading, error, data object, and refetch function
- Keep all parallel Promise.all batching logic intact

**Testing Checklist**:
- [ ] Hook fetches all data on mount
- [ ] Hook refetches when user changes
- [ ] Loading state managed correctly
- [ ] Error handling works
- [ ] Refetch function works
- [ ] Stripe onboarding check works
- [ ] All data objects populated correctly
- [ ] Admin/moderation flags set correctly

---

### 2. **useDatasetActions** (High Priority)
**File**: `src/lib/hooks/useDatasetActions.js`  
**Lines Extracted**: ~180 lines (7 handler functions + actionLoading state)  
**Complexity**: MEDIUM

**Purpose**: Centralize all dataset CRUD operations.

**Current Code Locations**:
- `handleDownload` (lines 414-458)
- `handleToggleActive` (lines 460-484)
- `handleEditDataset` (lines 486-495)
- `handleSaveEdit` (lines 497-531)
- `handleDeleteDataset` (lines 533-590)
- `handleRequestDeletion` (lines 592-623)

**API Design**:
```javascript
const {
  // State
  actionLoading,
  
  // Handlers
  handleDownload,
  handleToggleActive,
  handleEditDataset,
  handleSaveEdit,
  handleDeleteDataset,
  handleRequestDeletion,
} = useDatasetActions({
  user,
  setMyDatasets,
  setError,
  fetchDashboardData, // For refreshing after operations
  confirmDialogModal,
  editDatasetModal,
})
```

**Implementation Notes**:
- Accept dependencies as object parameter
- Manage internal `actionLoading` state
- All handlers use async/await
- Use handleSupabaseError for errors
- Use ERROR_MESSAGES for consistent messaging
- Update local state optimistically where appropriate
- Call fetchDashboardData after mutations

**Handler Details**:
1. **handleDownload**: Generate download link, handle demo datasets
2. **handleToggleActive**: Toggle dataset active status
3. **handleEditDataset**: Open edit modal with dataset data
4. **handleSaveEdit**: Save dataset edits to database
5. **handleDeleteDataset**: Check purchases, confirm, delete via Netlify function
6. **handleRequestDeletion**: Submit deletion request via Netlify function

**Testing Checklist**:
- [ ] Download works for real datasets
- [ ] Download works for demo datasets
- [ ] Toggle active/inactive works
- [ ] Edit modal opens with correct data
- [ ] Save edits persists changes
- [ ] Delete shows confirmation
- [ ] Delete works with/without purchases
- [ ] Deletion request submits correctly
- [ ] All actions update UI state
- [ ] Error handling works for all actions

---

### 3. **useBountyActions** (Medium Priority)
**File**: `src/lib/hooks/useBountyActions.js`  
**Lines Extracted**: ~100 lines (3 handler functions)  
**Complexity**: LOW-MEDIUM

**Purpose**: Centralize bounty management operations.

**Current Code Locations**:
- `handleCreateBounty` (lines 625-673)
- `handleCloseMyBounty` (lines 675-698)
- `handleDeleteBountySubmission` (lines 700-733)

**API Design**:
```javascript
const {
  handleCreateBounty,
  handleCloseMyBounty,
  handleDeleteBountySubmission,
} = useBountyActions({
  user,
  fetchDashboardData,
  setError,
})
```

**Implementation Notes**:
- Accept dependencies as object parameter
- All handlers use async/await
- handleCreateBounty logs activity for social feed
- handleCloseMyBounty confirms before closing
- handleDeleteBountySubmission confirms before deleting
- All handlers call fetchDashboardData after success

**Handler Details**:
1. **handleCreateBounty**: Validate, insert curation_request, log activity
2. **handleCloseMyBounty**: Confirm, update status to 'closed'
3. **handleDeleteBountySubmission**: Confirm, delete submission with RLS check

**Testing Checklist**:
- [ ] Create bounty validates fields
- [ ] Create bounty inserts record
- [ ] Create bounty logs activity
- [ ] Close bounty confirms first
- [ ] Close bounty updates status
- [ ] Delete submission confirms first
- [ ] Delete submission removes record
- [ ] All actions refresh dashboard
- [ ] Error handling works

---

### 4. **useStripeConnect** (Low Priority)
**File**: `src/lib/hooks/useStripeConnect.js`  
**Lines Extracted**: ~50 lines (1 handler + 2 state variables)  
**Complexity**: LOW

**Purpose**: Manage Stripe Connect onboarding flow.

**Current Code Locations**:
- `connectingStripe` state (line 84)
- `connectError` state (line 85)
- `handleConnectStripe` (lines 735-770)

**API Design**:
```javascript
const {
  connectingStripe,
  connectError,
  handleConnectStripe,
} = useStripeConnect({
  user,
  profile,
  setError,
})
```

**Implementation Notes**:
- Manage internal state for connecting and error
- Build return/refresh URLs for onboarding
- Call Netlify function to create onboarding link
- Redirect to Stripe on success
- Handle errors gracefully

**Testing Checklist**:
- [ ] Hook initializes with correct state
- [ ] handleConnectStripe calls Netlify function
- [ ] Success redirects to Stripe
- [ ] Error updates connectError state
- [ ] Error calls setError for display

---

## 🔄 Integration Plan

### Step 1: Create Hooks Directory Structure
```
src/lib/hooks/
├── useModalState.js (already exists)
├── useDashboardData.js (NEW)
├── useDatasetActions.js (NEW)
├── useBountyActions.js (NEW)
└── useStripeConnect.js (NEW)
```

### Step 2: Build Hooks (Sequential)
1. Create `useDashboardData.js` first (most complex, highest impact)
2. Create `useDatasetActions.js` second (medium complexity)
3. Create `useBountyActions.js` third (simpler)
4. Create `useStripeConnect.js` last (simplest)

### Step 3: Integrate into DashboardPage (Incremental with Testing)
1. **Import hooks at top of file**
   ```javascript
   import { useDashboardData } from '../lib/hooks/useDashboardData'
   import { useDatasetActions } from '../lib/hooks/useDatasetActions'
   import { useBountyActions } from '../lib/hooks/useBountyActions'
   import { useStripeConnect } from '../lib/hooks/useStripeConnect'
   ```

2. **Replace data fetching logic**
   - Remove all individual useState declarations (lines 62-90)
   - Remove fetchDashboardData callback (lines 111-408)
   - Remove useEffect (lines 410-412 partial)
   - Add single hook call:
     ```javascript
     const { loading, error: dataError, data, refetch } = useDashboardData(user, profile)
     const {
       myDatasets, earnings, payoutAccount, myPurchases, myFavorites,
       myBounties, mySubmissions, myCurationRequests, openCurationRequests,
       curatorProfile, curatorAssignedRequests, deletionRequests,
       isAdmin, hasModerationAccess
     } = data
     ```

3. **Replace dataset actions**
   - Remove handler functions (lines 414-623)
   - Add hook call:
     ```javascript
     const datasetActions = useDatasetActions({
       user,
       setMyDatasets: (updater) => {/* Update via refetch or local state */},
       setError,
       fetchDashboardData: refetch,
       confirmDialogModal,
       editDatasetModal,
     })
     ```

4. **Replace bounty actions**
   - Remove handler functions (lines 625-733)
   - Add hook call:
     ```javascript
     const bountyActions = useBountyActions({
       user,
       fetchDashboardData: refetch,
       setError,
     })
     ```

5. **Replace Stripe Connect**
   - Remove state and handler (lines 84-85, 735-770)
   - Add hook call:
     ```javascript
     const { connectingStripe, connectError, handleConnectStripe } = useStripeConnect({
       user,
       profile,
       setError,
     })
     ```

6. **Update all prop passing**
   - Pass handlers to respective tab components
   - Verify all props match component expectations

### Step 4: Test After Each Integration
- Run `npm test -- --run` after each hook integration
- Verify all 95 tests still pass
- Run `npm run lint` to check for errors
- Manually test affected functionality

---

## ✅ Success Criteria

### Code Metrics
- [ ] 4 custom hooks created in `src/lib/hooks/`
- [ ] DashboardPage.jsx reduced by 350-400 lines
- [ ] Final line count: 1,131-1,181 lines (from 1,531)
- [ ] Zero linting errors
- [ ] All 95 tests passing

### Functionality
- [ ] All dashboard data loads correctly
- [ ] All dataset operations work (download, toggle, edit, delete, request deletion)
- [ ] All bounty operations work (create, close, delete submission)
- [ ] Stripe Connect flow works
- [ ] Error handling preserved
- [ ] Loading states work correctly
- [ ] No regressions

### Code Quality
- [ ] Hooks follow React hooks best practices
- [ ] Proper dependency arrays in useEffect/useCallback
- [ ] Consistent error handling
- [ ] Clear API interfaces
- [ ] Reusable and testable
- [ ] Well-documented with JSDoc comments

---

## 📊 Expected Impact

### Line Reduction Breakdown
| Component | Lines Before | Lines After | Reduction |
|-----------|--------------|-------------|-----------|
| useState declarations | 30 | 0 | -30 |
| fetchDashboardData | 300 | 0 | -300 |
| Dataset handlers | 180 | 10 (hook calls) | -170 |
| Bounty handlers | 100 | 5 (hook calls) | -95 |
| Stripe Connect | 50 | 5 (hook calls) | -45 |
| **TOTAL** | **660** | **20** | **-640** |

**Note**: Some logic moves to new hook files (not a true deletion, but extracted). Net reduction in DashboardPage.jsx: ~350-400 lines after accounting for hook imports and calls.

### Cumulative Progress
| Phase | Completion | Lines Removed | File Size |
|-------|------------|---------------|-----------|
| Original | - | - | 2,550 lines |
| Phase 5 (Tabs) | ✅ 100% | -1,019 | 1,531 lines |
| **Phase 6 (Hooks)** | **🚀 0%** | **~-400** | **~1,131 lines** |
| **Total Reduction** | - | **-1,419** | **-56% from original** |

---

## 🚨 Risk Mitigation

### Potential Issues
1. **State synchronization**: Hooks manage separate state, may cause sync issues
   - **Mitigation**: Use refetch function, lift state where needed

2. **Dependency loops**: Hooks may create circular dependencies
   - **Mitigation**: Careful dependency management, use useCallback

3. **Testing complexity**: More files to test
   - **Mitigation**: Test hooks in isolation first, then integration

4. **Breaking changes**: Tab components expect specific prop structure
   - **Mitigation**: Maintain exact API contracts, verify props

### Rollback Plan
- Git checkpoint before starting: `git commit -m "checkpoint: Before Phase 6"`
- Commit after each hook creation: Incremental safety
- If critical issues arise: `git revert` to last working state

---

## 📝 Implementation Checklist

### Pre-Work
- [x] Read implementation plan
- [x] Understand current code structure
- [x] Identify extraction boundaries
- [x] Create todo list

### Development
- [ ] Create `useDashboardData.js`
- [ ] Create `useDatasetActions.js`
- [ ] Create `useBountyActions.js`
- [ ] Create `useStripeConnect.js`
- [ ] Integrate `useDashboardData` into DashboardPage
- [ ] Integrate `useDatasetActions` into DashboardPage
- [ ] Integrate `useBountyActions` into DashboardPage
- [ ] Integrate `useStripeConnect` into DashboardPage

### Testing
- [ ] Run unit tests (`npm test -- --run`)
- [ ] Run linting (`npm run lint`)
- [ ] Manual testing: Dashboard data loading
- [ ] Manual testing: Dataset operations
- [ ] Manual testing: Bounty operations
- [ ] Manual testing: Stripe Connect
- [ ] Verify zero regressions

### Documentation & Cleanup
- [ ] Add JSDoc comments to all hooks
- [ ] Create `PHASE_6_HOOKS_EXTRACTION_COMPLETE.md`
- [ ] Update `DASHBOARD_REFACTORING_IMPLEMENTATION_PLAN.md`
- [ ] Commit all changes
- [ ] Push to remote branch `refactor-phase-6-hooks`

---

## 🎉 Next Steps (Phase 7)

After Phase 6 completion, proceed to **Phase 7: Service Layer Creation**.

**Goals**:
- Extract Supabase API calls from hooks
- Create testable service layer
- Centralize data access patterns
- Further separate concerns

**Expected Impact**: Additional 100-150 line reduction from hooks, moving business logic to services.

---

**Let's build these hooks! 🚀**
