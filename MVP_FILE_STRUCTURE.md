# 📁 Setique Social MVP — Complete File Structure

**Date**: October 17, 2025  
**Status**: Implementation Roadmap  
**Goal**: Files to create for 30-day MVP

---

## 🗂️ File Structure Overview

```
SETIQUE/
│
├── sql/migrations/
│   └── 025_social_analytics_fields.sql          ⭐ NEW - Database schema
│
├── src/
│   ├── services/
│   │   ├── schemaDetectorService.js             ⭐ NEW - Platform detection
│   │   ├── hygieneService.js                    ⭐ NEW - PII removal
│   │   ├── pricingService.js                    ⭐ NEW - Pricing suggestions
│   │   └── documentationService.js              ⭐ NEW - Auto-generate README/SCHEMA
│   │
│   ├── lib/
│   │   └── platformConfigs/                     ⭐ NEW - Platform definitions
│   │       ├── index.js
│   │       ├── tiktok.json
│   │       ├── youtube.json
│   │       ├── instagram.json
│   │       ├── linkedin.json
│   │       └── shopify.json
│   │
│   ├── components/
│   │   ├── DatasetUploadModal.jsx               🔧 MODIFY - Add schema detection
│   │   ├── DatasetCard.jsx                      🔧 MODIFY - Add platform badges
│   │   ├── DatasetFilters.jsx                   🔧 MODIFY - Add platform filters
│   │   ├── CurationWorkflow.jsx                 🔧 MODIFY - Add social data tools
│   │   │
│   │   └── social/                              ⭐ NEW - Social-specific components
│   │       ├── PlatformBadge.jsx
│   │       ├── ExtendedFieldsPreview.jsx
│   │       ├── SchemaAnalysisResults.jsx
│   │       ├── PricingSuggestionCard.jsx
│   │       ├── HygieneReport.jsx
│   │       └── VersionSelector.jsx
│   │
│   ├── pages/
│   │   ├── BrowseDatasets.jsx                   🔧 MODIFY - Add platform filtering
│   │   ├── CuratorDashboard.jsx                 🔧 MODIFY - Add social job queue
│   │   └── DatasetDetail.jsx                    🔧 MODIFY - Show schema info
│   │
│   └── hooks/
│       ├── useSchemaDetection.js                ⭐ NEW - Schema detection hook
│       ├── usePricingSuggestion.js              ⭐ NEW - Pricing hook
│       └── useHygieneCheck.js                   ⭐ NEW - Hygiene hook
│
├── tests/
│   ├── services/
│   │   ├── schemaDetectorService.test.js        ⭐ NEW
│   │   ├── hygieneService.test.js               ⭐ NEW
│   │   └── pricingService.test.js               ⭐ NEW
│   │
│   └── fixtures/
│       ├── sample-tiktok.csv                    ⭐ NEW - Test data
│       ├── sample-youtube.csv                   ⭐ NEW
│       └── sample-instagram.csv                 ⭐ NEW
│
└── docs/
    ├── guides/
    │   ├── export-tiktok-analytics.md           ⭐ NEW - Creator guides
    │   ├── export-youtube-analytics.md          ⭐ NEW
    │   ├── export-instagram-analytics.md        ⭐ NEW
    │   └── pricing-your-dataset.md              ⭐ NEW
    │
    └── api/
        └── social-analytics-schema.md           ⭐ NEW - API documentation
```

---

## 📊 Implementation Phases

### **Phase 1: Backend Services (Days 1-5)** ⭐ Priority 1

#### **Files to Create**:

1. **`sql/migrations/025_social_analytics_fields.sql`** (Day 1)
   - Lines: ~150
   - Adds 15+ columns to datasets table
   - Indexes for filtering
   - Status: **NOT CREATED**

2. **`src/services/schemaDetectorService.js`** (Day 2)
   - Lines: ~350
   - Platform detection logic
   - Header normalization (USS v1.0)
   - Extended field detection
   - Row validation
   - Status: **NOT CREATED**

3. **`src/services/hygieneService.js`** (Day 3)
   - Lines: ~250
   - PII pattern detection (7 types)
   - Automated removal
   - CSV processing
   - Report generation
   - Status: **NOT CREATED**

4. **`src/services/pricingService.js`** (Day 4-5)
   - Lines: ~200
   - Dynamic pricing calculation
   - Factor analysis (5 factors)
   - Reasoning generation
   - Market comparables
   - Status: **NOT CREATED**

5. **`src/lib/platformConfigs/`** (Day 5)
   - 5 JSON config files (tiktok, youtube, instagram, linkedin, shopify)
   - Each: ~80 lines
   - Header aliases, PII rules, quality checks
   - Status: **NOT CREATED**

---

### **Phase 2: Upload Flow (Days 6-10)** ⭐ Priority 2

#### **Files to Modify**:

1. **`src/components/DatasetUploadModal.jsx`** (Day 6-7)
   - Add: Schema detection integration (~150 lines)
   - Add: Pricing suggestion UI (~100 lines)
   - Add: Version selector (~50 lines)
   - Current: ~400 lines → New: ~700 lines
   - Status: **NOT MODIFIED**

#### **New Components**:

2. **`src/components/social/SchemaAnalysisResults.jsx`** (Day 7)
   - Lines: ~100
   - Display platform detection
   - Show extended fields
   - Confidence indicator
   - Status: **NOT CREATED**

3. **`src/components/social/PricingSuggestionCard.jsx`** (Day 7)
   - Lines: ~120
   - Show suggested price
   - Factor breakdown
   - Price input with feedback
   - Status: **NOT CREATED**

4. **`src/components/social/VersionSelector.jsx`** (Day 8)
   - Lines: ~80
   - Standard vs Extended vs Both
   - Pricing preview
   - Recommendation logic
   - Status: **NOT CREATED**

#### **Hooks**:

5. **`src/hooks/useSchemaDetection.js`** (Day 8)
   - Lines: ~80
   - Async file analysis
   - Loading/error states
   - Status: **NOT CREATED**

6. **`src/hooks/usePricingSuggestion.js`** (Day 8)
   - Lines: ~60
   - Calculate pricing
   - Update on changes
   - Status: **NOT CREATED**

---

### **Phase 3: Marketplace (Days 11-15)** ⭐ Priority 3

#### **Files to Modify**:

1. **`src/components/DatasetFilters.jsx`** (Day 11-12)
   - Add: Platform filter chips (~50 lines)
   - Add: Extended fields filter (~30 lines)
   - Add: Hygiene verified filter (~20 lines)
   - Current: ~200 lines → New: ~300 lines
   - Status: **NOT MODIFIED**

2. **`src/components/DatasetCard.jsx`** (Day 13-14)
   - Add: Platform badge (~30 lines)
   - Add: Extended fields indicator (~40 lines)
   - Add: Schema compliance badge (~20 lines)
   - Current: ~250 lines → New: ~340 lines
   - Status: **NOT MODIFIED**

#### **New Components**:

3. **`src/components/social/PlatformBadge.jsx`** (Day 13)
   - Lines: ~60
   - Platform icon + name
   - Color coding
   - Status: **NOT CREATED**

4. **`src/components/social/ExtendedFieldsPreview.jsx`** (Day 14)
   - Lines: ~90
   - Collapsible field list
   - Field type indicators
   - Status: **NOT CREATED**

---

### **Phase 4: Curator Tools (Days 16-21)** ⭐ Priority 4

#### **Files to Modify**:

1. **`src/pages/CuratorDashboard.jsx`** (Day 16-17)
   - Add: Social analytics job queue (~80 lines)
   - Add: Platform filters (~40 lines)
   - Add: Schema preview (~30 lines)
   - Current: ~500 lines → New: ~650 lines
   - Status: **NOT MODIFIED**

2. **`src/components/CurationWorkflow.jsx`** (Day 18-19)
   - Add: Schema validation checklist (~60 lines)
   - Add: Manual PII review tool (~80 lines)
   - Add: Extended field verification (~50 lines)
   - Current: ~400 lines → New: ~590 lines
   - Status: **NOT MODIFIED**

#### **New Components**:

3. **`src/components/social/HygieneReport.jsx`** (Day 18)
   - Lines: ~100
   - PII findings display
   - Severity indicators
   - Action buttons
   - Status: **NOT CREATED**

#### **New Services**:

4. **`src/services/documentationService.js`** (Day 20-21)
   - Lines: ~200
   - Auto-generate README.md
   - Auto-generate SCHEMA.json
   - Include hygiene summary
   - Status: **NOT CREATED**

---

### **Phase 5: Testing & Launch (Days 22-30)** ⭐ Priority 5

#### **Test Files**:

1. **`tests/services/schemaDetectorService.test.js`** (Day 22)
   - Lines: ~150
   - Test all platform detections
   - Test normalization
   - Status: **NOT CREATED**

2. **`tests/services/hygieneService.test.js`** (Day 22)
   - Lines: ~120
   - Test PII detection
   - Test removal accuracy
   - Status: **NOT CREATED**

3. **`tests/services/pricingService.test.js`** (Day 23)
   - Lines: ~100
   - Test pricing calculations
   - Test all factors
   - Status: **NOT CREATED**

#### **Test Fixtures**:

4. **`tests/fixtures/sample-*.csv`** (Day 22)
   - 3 sample CSV files (TikTok, YouTube, Instagram)
   - Realistic data for testing
   - Status: **NOT CREATED**

#### **Documentation**:

5. **Creator Guides** (Day 24-25)
   - `docs/guides/export-tiktok-analytics.md` (~80 lines)
   - `docs/guides/export-youtube-analytics.md` (~90 lines)
   - `docs/guides/export-instagram-analytics.md` (~75 lines)
   - `docs/guides/pricing-your-dataset.md` (~100 lines)
   - Status: **NOT CREATED**

---

## 📊 File Creation Summary

### **New Files to Create: 32**

| Category | Count | Lines | Priority |
|----------|-------|-------|----------|
| **Backend Services** | 5 | ~1,150 | P1 ⭐⭐⭐ |
| **React Components** | 9 | ~730 | P2 ⭐⭐ |
| **React Hooks** | 3 | ~220 | P2 ⭐⭐ |
| **Platform Configs** | 5 | ~400 | P1 ⭐⭐⭐ |
| **Test Files** | 3 | ~370 | P5 ⭐ |
| **Test Fixtures** | 3 | N/A | P5 ⭐ |
| **Documentation** | 4 | ~345 | P5 ⭐ |

**Total New Lines**: ~3,215

### **Files to Modify: 6**

| File | Current Lines | New Lines | Change |
|------|---------------|-----------|--------|
| `DatasetUploadModal.jsx` | ~400 | ~700 | +300 |
| `DatasetFilters.jsx` | ~200 | ~300 | +100 |
| `DatasetCard.jsx` | ~250 | ~340 | +90 |
| `CuratorDashboard.jsx` | ~500 | ~650 | +150 |
| `CurationWorkflow.jsx` | ~400 | ~590 | +190 |
| `BrowseDatasets.jsx` | ~300 | ~350 | +50 |

**Total Modified Lines**: +880

---

## 🚀 Implementation Order (Critical Path)

### **Week 1: Foundation**
```
Day 1:  025_social_analytics_fields.sql         (Database)
Day 2:  schemaDetectorService.js               (Core service)
Day 3:  hygieneService.js                      (Core service)
Day 4:  pricingService.js                      (Core service)
Day 5:  platformConfigs/*.json                 (Configurations)
```

### **Week 2: Upload Flow**
```
Day 6:  SchemaAnalysisResults.jsx              (Component)
Day 7:  PricingSuggestionCard.jsx              (Component)
Day 7:  Modify DatasetUploadModal.jsx          (Integration)
Day 8:  useSchemaDetection.js                  (Hook)
Day 8:  usePricingSuggestion.js                (Hook)
Day 9:  VersionSelector.jsx                    (Component)
Day 10: Backend API integration                (Upload endpoint)
```

### **Week 3: Marketplace**
```
Day 11: PlatformBadge.jsx                      (Component)
Day 12: Modify DatasetFilters.jsx              (Add filters)
Day 13: ExtendedFieldsPreview.jsx              (Component)
Day 14: Modify DatasetCard.jsx                 (Add badges)
Day 15: Modify BrowseDatasets.jsx              (Search integration)
```

### **Week 4: Launch**
```
Day 16: Modify CuratorDashboard.jsx            (Social queue)
Day 17: HygieneReport.jsx                      (Component)
Day 18: Modify CurationWorkflow.jsx            (Social tools)
Day 19: documentationService.js                (Auto-docs)
Day 20: Testing + fixtures                     (QA)
Day 21: Creator guides                         (Documentation)
Day 22-28: Beta testing + iteration            (Launch prep)
Day 29-30: Public launch                       (Go live! 🚀)
```

---

## 🎯 Next Steps

**Option A**: Create all files at once (full MVP scaffolding)
- I'll create all 32 new files + modify 6 existing
- You'll have complete structure ready
- Time: ~2 hours (me creating files)

**Option B**: Incremental build (one week at a time)
- Start with Week 1 (5 files: migration + 3 services + configs)
- Test each week before moving forward
- Time: ~30 minutes per week

**Option C**: Critical path only (minimum viable)
- Just the 10 most critical files
- Enough to demonstrate core functionality
- Time: ~45 minutes

**Which approach do you prefer?** 

I recommend **Option B** - let's build Week 1 right now! 🚀
