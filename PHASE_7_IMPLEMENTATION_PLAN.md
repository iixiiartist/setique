# Phase 7: Service Layer Creation - Implementation Plan

**Status**: 🚀 READY TO START  
**Created**: January 2025  
**Estimated Time**: 2-3 hours  
**Risk Level**: LOW  
**Expected Reduction**: 280-320 lines from hooks (35-40% of hook code)

---

## 📋 Executive Summary

Phase 7 extracts all Supabase API calls and external service interactions from custom hooks into a dedicated service layer. This final separation creates a clean architecture: UI → Hooks → Services → External APIs.

### Current State (After Phase 6)
- **Custom Hooks**: 4 hooks (845 lines total)
  - `useDashboardData.js`: 330 lines (heavy Supabase queries)
  - `useDatasetActions.js`: 270 lines (Supabase + Netlify functions)
  - `useBountyActions.js`: 170 lines (Supabase + activity logging)
  - `useStripeConnect.js`: 75 lines (Netlify functions)
- **Pain Points**:
  - Hooks contain direct Supabase queries (hard to mock)
  - API logic mixed with state management
  - Difficult to test in isolation
  - No centralized error handling at API layer
  - Services duplicated across hooks

### Target State (After Phase 7)
- **Service Layer**: 4 services (~440 lines total)
  - `dashboardService.js`: All dashboard data fetching
  - `datasetService.js`: Dataset CRUD operations
  - `bountyService.js`: Bounty/curation request operations
  - `stripeService.js`: Stripe Connect integration
- **Refactored Hooks**: Thinner, focused on state management (~525 lines)
  - `useDashboardData.js`: 330 → ~180 lines (45% reduction)
  - `useDatasetActions.js`: 270 → ~150 lines (44% reduction)
  - `useBountyActions.js`: 170 → ~90 lines (47% reduction)
  - `useStripeConnect.js`: 75 → ~35 lines (53% reduction)
- **Benefits**:
  - Easy to mock services for testing
  - Centralized API error handling
  - Reusable across different components
  - Clear separation: UI → Hooks → Services → APIs
  - Single source of truth for data access

---

## 🎯 Services to Create

### 1. **dashboardService.js** (Highest Priority)
**File**: `src/services/dashboardService.js`  
**Lines**: ~200 lines  
**Complexity**: HIGH

**Purpose**: Centralize all dashboard data fetching operations.

**Methods to Extract** (from `useDashboardData.js`):
```javascript
export const dashboardService = {
  // Datasets
  async fetchUserDatasets(userId) { },
  async fetchDatasetPurchaseCounts(datasetIds) { },
  
  // Earnings & Payouts
  async fetchEarnings(userId) { },
  async fetchPayoutAccount(userId) { },
  async verifyStripeAccount(creatorId) { }, // Background verification
  
  // Purchases & Favorites
  async fetchUserPurchases(userId) { },
  async fetchUserFavorites(userId) { },
  
  // Bounties & Submissions
  async fetchUserBounties(userId) { },
  async fetchBountySubmissions(userId) { },
  async fetchBountyProposals(requestIds) { },
  
  // Curation Requests
  async fetchCurationRequests(userId) { },
  async fetchOpenCurationRequests(limit = 20) { },
  
  // Pro Curator
  async fetchCuratorProfile(userId) { },
  async fetchAssignedRequests(curatorId) { },
  async fetchProposalsForRequests(requestIds) { },
  async fetchCreatorProfiles(creatorIds) { },
  
  // Admin & Deletion
  async fetchDeletionRequests(userId) { },
  async checkAdminStatus(userId) { },
  async checkModerationAccess(userId, trustLevel) { },
}
```

**Impact**: Reduces `useDashboardData.js` from 330 → ~180 lines

---

### 2. **datasetService.js** (High Priority)
**File**: `src/services/datasetService.js`  
**Lines**: ~120 lines  
**Complexity**: MEDIUM

**Purpose**: Centralize dataset CRUD and management operations.

**Methods to Extract** (from `useDatasetActions.js`):
```javascript
export const datasetService = {
  // Download
  async generateDownloadLink(datasetId, userId) {
    // Calls /.netlify/functions/generate-download
    // Returns { downloadUrl, fileName, isDemo }
  },
  
  // Toggle Active
  async toggleActiveStatus(datasetId, userId, isActive) {
    // Updates datasets.is_active
    // Returns updated dataset
  },
  
  // Update
  async updateDataset(datasetId, userId, updates) {
    // Updates dataset fields
    // Returns updated dataset
  },
  
  // Delete
  async checkDatasetPurchases(datasetId) {
    // Checks if dataset has purchases
    // Returns { hasPurchases, count }
  },
  
  async deleteDataset(datasetId, userId) {
    // Calls /.netlify/functions/delete-dataset
    // Returns success status
  },
  
  // Deletion Request
  async requestDeletion(datasetId, reason, accessToken) {
    // Calls /.netlify/functions/request-deletion
    // Returns request status
  },
}
```

**Impact**: Reduces `useDatasetActions.js` from 270 → ~150 lines

---

### 3. **bountyService.js** (Medium Priority)
**File**: `src/services/bountyService.js`  
**Lines**: ~80 lines  
**Complexity**: LOW-MEDIUM

**Purpose**: Centralize bounty/curation request operations.

**Methods to Extract** (from `useBountyActions.js`):
```javascript
export const bountyService = {
  // Create
  async createBounty(bountyData) {
    // Inserts into curation_requests
    // Returns created bounty with ID
  },
  
  // Close
  async closeBounty(bountyId, userId) {
    // Updates status to 'closed'
    // Returns updated bounty
  },
  
  // Delete Submission
  async deleteBountySubmission(submissionId, userId) {
    // Deletes from bounty_submissions with RLS check
    // Returns deleted submission or null
  },
}
```

**Impact**: Reduces `useBountyActions.js` from 170 → ~90 lines

---

### 4. **stripeService.js** (Low Priority)
**File**: `src/services/stripeService.js`  
**Lines**: ~40 lines  
**Complexity**: LOW

**Purpose**: Centralize Stripe Connect operations.

**Methods to Extract** (from `useStripeConnect.js`):
```javascript
export const stripeService = {
  // Onboarding
  async createOnboardingLink(creatorId, email, returnUrl, refreshUrl) {
    // Calls /.netlify/functions/connect-onboarding
    // Returns { url } for redirect
  },
  
  // Verification
  async verifyAccount(creatorId) {
    // Calls /.netlify/functions/verify-stripe-account
    // Returns { success, message, account }
  },
}
```

**Impact**: Reduces `useStripeConnect.js` from 75 → ~35 lines

---

## 🔧 Service Architecture Patterns

### Standard Service Method Pattern
```javascript
/**
 * Fetch user datasets with partnerships
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of datasets
 * @throws {Error} If query fails
 */
export async function fetchUserDatasets(userId) {
  const { data, error } = await supabase
    .from('datasets')
    .select(`
      *,
      dataset_partnerships (
        id,
        status,
        curator_user_id,
        pro_curators (
          display_name,
          badge_level
        )
      )
    `)
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}
```

### Error Handling Strategy
- Services **throw errors** (don't handle)
- Hooks **catch errors** and manage error state
- Use `handleSupabaseError()` in hooks for logging
- Services return clean data or throw

### Return Value Conventions
- Always return data (never `undefined`)
- Return empty array `[]` for list queries with no results
- Return `null` for single-item queries with no results
- Throw errors for failures (let hooks handle)

---

## 📝 Implementation Steps

### Step 1: Create Services Directory
```
src/services/
├── dashboardService.js
├── datasetService.js
├── bountyService.js
└── stripeService.js
```

### Step 2: Extract Methods (Service by Service)
1. **dashboardService.js** - Extract all fetch methods from useDashboardData
2. **datasetService.js** - Extract all dataset operations from useDatasetActions
3. **bountyService.js** - Extract all bounty operations from useBountyActions
4. **stripeService.js** - Extract Stripe operations from useStripeConnect

### Step 3: Refactor Hooks (One at a Time)
1. **useDashboardData.js** - Replace Supabase queries with service calls
2. **useDatasetActions.js** - Replace operations with service calls
3. **useBountyActions.js** - Replace operations with service calls
4. **useStripeConnect.js** - Replace fetch calls with service calls

### Step 4: Test After Each Hook Refactor
- Run `npm test -- --run` after each hook refactor
- Verify all 95 tests pass
- Run `npm run lint` to check for errors
- Manually test affected functionality

---

## ✅ Success Criteria

### Code Metrics
- [ ] 4 service files created in `src/services/`
- [ ] 280-320 lines extracted from hooks
- [ ] All hooks reduced by 35-50%
- [ ] Zero linting errors
- [ ] All 95 tests passing

### Architecture
- [ ] No direct Supabase queries in hooks
- [ ] All API calls go through services
- [ ] Services are pure functions (no state)
- [ ] Clear separation of concerns
- [ ] Easy to mock for testing

### Code Quality
- [ ] Full JSDoc documentation for all service methods
- [ ] Consistent error handling
- [ ] Consistent return value patterns
- [ ] No code duplication
- [ ] Follows established patterns

---

## 📊 Expected Impact

### Hook Size Reduction
| Hook | Before | After | Reduction |
|------|--------|-------|-----------|
| useDashboardData.js | 330 | ~180 | -150 (45%) |
| useDatasetActions.js | 270 | ~150 | -120 (44%) |
| useBountyActions.js | 170 | ~90 | -80 (47%) |
| useStripeConnect.js | 75 | ~35 | -40 (53%) |
| **TOTAL** | **845** | **~455** | **-390 (46%)** |

*Note: ~440 lines move to services, net reduction in hooks is ~390 lines*

### Service Layer
| Service | Lines | Methods | Complexity |
|---------|-------|---------|------------|
| dashboardService.js | ~200 | 16 | High |
| datasetService.js | ~120 | 6 | Medium |
| bountyService.js | ~80 | 3 | Low |
| stripeService.js | ~40 | 2 | Low |
| **TOTAL** | **~440** | **27** | **-** |

### Architecture Benefits
- ✅ **Testability**: Services can be mocked easily
- ✅ **Reusability**: Services can be used anywhere
- ✅ **Maintainability**: Single place to update API logic
- ✅ **Debugging**: Centralized API error handling
- ✅ **Performance**: Easier to add caching later

---

## 🚨 Risk Mitigation

### Potential Issues
1. **Breaking Changes**: Service API might differ from current implementation
   - **Mitigation**: Keep service APIs identical to current patterns
   
2. **Testing Complexity**: More files to test
   - **Mitigation**: Services are pure functions, easier to test in isolation
   
3. **Import Chains**: Hooks → Services → Supabase (longer chain)
   - **Mitigation**: Clear separation improves debugging

### Rollback Plan
- Git checkpoint before starting: `git commit -m "checkpoint: Before Phase 7"`
- Commit after each service creation
- Commit after each hook refactor
- If critical issues: `git revert` to last working state

---

## 📋 Implementation Checklist

### Pre-Work
- [x] Read implementation plan
- [ ] Create Phase 7 branch
- [ ] Understand current hook structure
- [ ] Identify extraction boundaries

### Service Creation
- [ ] Create `src/services/` directory
- [ ] Create `dashboardService.js`
- [ ] Create `datasetService.js`
- [ ] Create `bountyService.js`
- [ ] Create `stripeService.js`

### Hook Refactoring
- [ ] Refactor `useDashboardData.js`
- [ ] Refactor `useDatasetActions.js`
- [ ] Refactor `useBountyActions.js`
- [ ] Refactor `useStripeConnect.js`

### Testing
- [ ] Run unit tests after each refactor
- [ ] Run linting after each refactor
- [ ] Manual testing: Dashboard data loading
- [ ] Manual testing: Dataset operations
- [ ] Manual testing: Bounty operations
- [ ] Manual testing: Stripe Connect

### Documentation & Cleanup
- [ ] Add JSDoc to all service methods
- [ ] Create `PHASE_7_SERVICE_LAYER_COMPLETE.md`
- [ ] Update `DASHBOARD_REFACTORING_IMPLEMENTATION_PLAN.md`
- [ ] Commit all changes
- [ ] Push to remote branch

---

## 🎯 Next Steps (Phase 8 Preview)

After Phase 7, proceed to **Phase 8: Performance Optimization**.

**Goals**:
- Add `useMemo` for expensive computations
- Add `useCallback` where needed
- Optimize re-renders
- Add loading skeletons
- Improve perceived performance

**Expected Impact**: Better performance, no line reduction (adding optimization code)

---

**Let's build the service layer! 🚀**
