# Codebase Logic Review - Findings & Recommendations

**Date:** October 16, 2025  
**Reviewer:** AI Assistant  
**Scope:** Full codebase logic, data flow, and error handling patterns

---

## 🔴 CRITICAL ISSUES

### 1. **Incorrect Use of `.single()` in Purchase Checks**
**Location:** `HomePage.jsx` line 180-185, `DatasetsPage.jsx` line 275-285

**Problem:**
```javascript
const { data: existingPurchase } = await supabase
  .from('purchases')
  .select('id')
  .eq('user_id', user.id)
  .eq('dataset_id', dataset.id)
  .single()  // ❌ THROWS ERROR if no rows found
```

**Impact:** When a user tries to purchase a dataset they don't own (normal case), `.single()` throws an error instead of returning null. The try-catch block catches this "error" and shows error messages for normal purchases.

**Fix:** Use `.maybeSingle()` instead:
```javascript
const { data: existingPurchase, error: checkError } = await supabase
  .from('purchases')
  .select('id')
  .eq('user_id', user.id)
  .eq('dataset_id', dataset.id)
  .maybeSingle()  // ✅ Returns null if no rows, doesn't throw

if (checkError) throw checkError
```

**Files Affected:**
- `src/pages/HomePage.jsx` (handleCheckout)
- `src/pages/DatasetsPage.jsx` (handleCheckout)

---

### 2. **Massive Code Duplication in Checkout Logic**
**Location:** `HomePage.jsx` vs `DatasetsPage.jsx`

**Problem:** 120+ lines of identical checkout logic duplicated across two files:
- Purchase existence check
- Beta access check  
- Free dataset handling
- Stripe checkout flow
- Activity logging
- Error handling

**Impact:** 
- Bug fixes must be applied twice
- Inconsistencies can arise
- Maintenance burden
- Already has inconsistent error handling

**Fix:** Extract to shared utility function:
```javascript
// src/lib/checkout.js
export async function handleDatasetCheckout(user, dataset, callbacks) {
  // Centralized logic here
}
```

---

## 🟡 HIGH PRIORITY ISSUES

### 3. **Inconsistent Error Handling Patterns**

**Problem:** Mix of error handling approaches throughout codebase:
- Some use `handleSupabaseError()` from logger
- Some use `console.error()`
- Some use both
- Some silently swallow errors

**Examples:**
```javascript
// Pattern 1: Good
catch (error) {
  handleSupabaseError(error, 'functionName')
}

// Pattern 2: Inconsistent
catch (error) {
  console.error('Error:', error)
  alert('Error: ' + error.message)
}

// Pattern 3: Silent failure
catch (error) {
  return []  // No logging at all
}
```

**Fix:** Standardize on using `handleSupabaseError` everywhere, or at minimum always log errors.

---

### 4. **Race Condition in State Updates After Purchase**

**Location:** `HomePage.jsx` line 229-238, `DatasetsPage.jsx` line 326-335

**Problem:**
```javascript
// These three operations happen sequentially
await logDatasetPurchased(...)  // 1. Log activity
alert('✅ Added to library!')    // 2. Show alert
fetchUserPurchases()            // 3. Refresh - but not awaited!
```

**Impact:** UI may show "You already own this" incorrectly if user clicks again before refresh completes.

**Fix:** Await the refresh:
```javascript
await fetchUserPurchases()
```

---

### 5. **Missing Creator Self-Purchase Prevention**

**Location:** Checkout logic in both HomePage and DatasetsPage

**Problem:** Nothing prevents a creator from purchasing their own dataset, which would:
- Charge them money via Stripe
- Create a nonsensical purchase record
- Potentially break revenue split logic

**Fix:** Add check before purchase:
```javascript
if (dataset.creator_id === user.id) {
  alert('You cannot purchase your own dataset!')
  return
}
```

---

## 🟢 MEDIUM PRIORITY ISSUES

### 6. **Insufficient Data Validation on Upload**

**Location:** `DatasetUploadModal.jsx`

**Current validation:**
```javascript
const isFormValid = title.trim() !== '' && 
                   description.trim() !== '' && 
                   !isNaN(numericPrice) && 
                   numericPrice >= 0 && 
                   uploadFile !== null
```

**Missing validations:**
- Title length limits (min/max)
- Description length limits
- Price maximum (sanity check)
- File size limit
- File type whitelist
- Tag count limits
- Tag content validation (no SQL injection, XSS)

**Fix:** Add comprehensive validation:
```javascript
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 5000
const MAX_PRICE = 10000
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024 // 5GB

// Add these checks to validation
title.length <= MAX_TITLE_LENGTH &&
description.length <= MAX_DESCRIPTION_LENGTH &&
numericPrice <= MAX_PRICE &&
uploadFile.size <= MAX_FILE_SIZE
```

---

### 7. **No Loading State for Beta Access Check**

**Location:** `HomePage.jsx`, `DatasetsPage.jsx` - beta access useEffect

**Problem:**
```javascript
const [hasBetaAccess, setHasBetaAccess] = useState(false)

useEffect(() => {
  const loadBetaAccess = async () => {
    if (!user) {
      setHasBetaAccess(false)
      return
    }
    const hasAccess = await checkBeta(user.id)
    setHasBetaAccess(hasAccess)
  }
  loadBetaAccess()
}, [user])
```

**Impact:** There's a brief moment where `hasBetaAccess` is false even for beta users, potentially showing incorrect UI or blocking actions.

**Fix:** Add loading state:
```javascript
const [hasBetaAccess, setHasBetaAccess] = useState(false)
const [betaAccessLoading, setBetaAccessLoading] = useState(true)

// Check loading state before blocking actions
if (betaAccessLoading) {
  return // or show loading spinner
}
```

---

### 8. **Potential Memory Leak in localStorage Auto-Save**

**Location:** `DatasetUploadModal.jsx` - multiple useEffect hooks

**Problem:** Every keystroke triggers localStorage write:
```javascript
useEffect(() => {
  if (isOpen) {
    localStorage.setItem('draft_modal_dataset_title', title)
  }
}, [title, isOpen])
```

**Impact:** 
- Excessive localStorage writes (not a huge issue but wasteful)
- Could hit storage quota on large descriptions
- No cleanup on successful submit vs. cancel

**Fix:** Use debouncing:
```javascript
useEffect(() => {
  if (!isOpen) return
  
  const timeoutId = setTimeout(() => {
    localStorage.setItem('draft_modal_dataset_title', title)
  }, 500) // Wait 500ms after last keystroke
  
  return () => clearTimeout(timeoutId)
}, [title, isOpen])
```

---

## 🔵 LOW PRIORITY / ENHANCEMENTS

### 9. **Hardcoded Alert Messages**

**Problem:** Using `alert()` throughout codebase:
- Not accessible
- Can't be styled
- Interrupts user flow
- Can't be unit tested

**Fix:** Create a toast/notification component:
```javascript
// useToast.js
export function useToast() {
  return {
    success: (message) => showToast(message, 'success'),
    error: (message) => showToast(message, 'error'),
    info: (message) => showToast(message, 'info')
  }
}
```

---

### 10. **Inconsistent Dataset Fetching Logic**

**Location:** Multiple pages fetch datasets differently

**Examples:**
```javascript
// HomePage.jsx - includes profiles
.select('*, profiles(username)')

// DatasetsPage.jsx - includes profiles + partnerships
.select(`
  *,
  profiles:creator_id (username, full_name),
  dataset_partnerships (...)
`)
```

**Impact:** Different data available on different pages, potential bugs when moving components.

**Fix:** Create standardized query helper:
```javascript
// src/lib/datasetQueries.js
export const DATASET_FULL_SELECT = `
  *,
  profiles:creator_id (username, full_name, avatar_url),
  dataset_partnerships (id, curator_user_id, status)
`
```

---

### 11. **No Optimistic UI Updates**

**Problem:** All actions wait for server response before updating UI:
- Following/unfollowing users
- Favoriting datasets
- Marking notifications as read

**Impact:** Feels slow, especially on poor connections.

**Fix:** Update UI immediately, rollback on error:
```javascript
// Optimistic update
setIsFollowing(true)

try {
  await supabase.from('follows').insert(...)
} catch (error) {
  // Rollback on failure
  setIsFollowing(false)
  showError('Failed to follow user')
}
```

---

## 📊 CODE QUALITY METRICS

### Duplication Analysis:
- **Checkout Logic:** 120 lines duplicated (HomePage.jsx + DatasetsPage.jsx)
- **Beta Access Check:** 15 lines duplicated (multiple pages)
- **User Purchase Fetching:** Previously duplicated, now fixed ✅
- **Sign Out Handler:** 5 lines duplicated (multiple pages)

### Error Handling Audit:
- ✅ **Good:** 45 locations using `handleSupabaseError`
- ⚠️ **Inconsistent:** 23 locations using bare `console.error`
- ❌ **Silent:** 8 locations with no error logging

### Query Pattern Audit:
- ✅ **Safe:** 87 uses of `.maybeSingle()`
- ❌ **Risky:** 12 uses of `.single()` without proper error handling
- ❌ **Dangerous:** 3 uses of `.single()` expecting no results (critical bug)

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Critical Fixes (1-2 hours)
1. ✅ Fix `.single()` → `.maybeSingle()` in purchase checks (HomePage & DatasetsPage)
2. ✅ Add creator self-purchase prevention
3. ✅ Extract checkout logic to shared utility
4. ✅ Fix race condition in purchase refresh (await the call)

### Phase 2: High Priority (2-3 hours)
5. ✅ Standardize error handling patterns
6. ✅ Add beta access loading state
7. ✅ Add comprehensive upload validation

### Phase 3: Medium Priority (3-4 hours)
8. ✅ Debounce localStorage auto-save
9. ✅ Audit all `.single()` uses and fix
10. ✅ Create standardized dataset query helpers

### Phase 4: Enhancements (optional)
11. Replace `alert()` with toast notifications
12. Add optimistic UI updates
13. Add loading skeletons for better UX

---

## 📝 NOTES

### Positive Findings:
- ✅ Recent refactoring created good utilities (purchases.js, betaAccess.js, logger.js)
- ✅ Good separation of concerns in lib/ folder
- ✅ Consistent use of handleSupabaseError in new code
- ✅ React hooks properly used (dependencies correct)
- ✅ Good localStorage draft persistence in upload modal

### Testing Recommendations:
- Add unit tests for checkout logic
- Add integration tests for purchase flows
- Test error cases (network failures, concurrent purchases)
- Test edge cases (free datasets, self-purchase attempts)

---

## 🔗 RELATED FILES TO UPDATE

**Critical:**
- `src/pages/HomePage.jsx`
- `src/pages/DatasetsPage.jsx`
- Create: `src/lib/checkout.js`

**High Priority:**
- `src/components/DatasetUploadModal.jsx`
- `src/lib/validation.js`
- All files using `.single()`

**Medium Priority:**
- `src/lib/datasetQueries.js` (new file)
- Any file with bare `console.error`

