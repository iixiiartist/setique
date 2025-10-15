# Raw Uploads Implementation Plan
## Complete System for Multi-Level Dataset Curation

**Version:** 1.0  
**Created:** January 2025  
**Status:** Planning Phase

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Database Schema Changes](#database-schema-changes)
3. [UI/UX Design](#uiux-design)
4. [Component Updates](#component-updates)
5. [Logic & Business Rules](#logic--business-rules)
6. [Migration Strategy](#migration-strategy)
7. [Testing Checklist](#testing-checklist)
8. [Rollout Plan](#rollout-plan)

---

## Executive Summary

### Goals
1. **Lower barrier to entry** - Allow non-technical users to upload raw, unlabeled data
2. **Market segmentation** - Create distinct tiers: Raw → Partial → Curated
3. **Pro Curator funnel** - Drive raw data owners toward curation requests
4. **Maintain quality** - Clear labeling and filtering to prevent marketplace confusion
5. **Quality assurance** - Admin review required for all raw uploads from non-Pro-Curators

### Impact Assessment
- ✅ **No breaking changes** - All existing datasets default to "curated"
- ✅ **Backward compatible** - Current upload flow remains unchanged for existing users
- ✅ **Additive only** - New fields/features don't affect existing functionality
- ⚠️ **UI updates required** - Filters, badges, and upload modal need changes
- ⚠️ **Admin workflow required** - Review system for raw uploads before listing

### Timeline
- **Phase 1** (Week 1): Database migrations + basic badges
- **Phase 2** (Week 2): Upload modal dual-track system
- **Phase 3** (Week 3): Marketplace filters + Resources page
- **Phase 4** (Week 4): Pro Curator integration + testing

---

## Database Schema Changes

### Migration 026: Add Curation Level System

```sql
-- filepath: supabase/migrations/026_curation_level_system.sql

BEGIN;

-- =====================================================
-- STEP 1: Add curation_level column to datasets
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS curation_level TEXT DEFAULT 'curated' 
CHECK (curation_level IN ('raw', 'partial', 'curated'));

COMMENT ON COLUMN datasets.curation_level IS 
'Indicates data preparation level:
- raw: Unprocessed data, no labels/metadata
- partial: Some labeling/organization done
- curated: Fully labeled, cleaned, ready for training';

-- =====================================================
-- STEP 2: Add sample preview URLs
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS sample_preview_urls TEXT[] DEFAULT '{}';

COMMENT ON COLUMN datasets.sample_preview_urls IS 
'Array of public URLs to sample files (5-10 examples) for preview before purchase';

-- =====================================================
-- STEP 3: Add metadata completeness indicator
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS metadata_completeness INTEGER DEFAULT 100 
CHECK (metadata_completeness >= 0 AND metadata_completeness <= 100);

COMMENT ON COLUMN datasets.metadata_completeness IS 
'Percentage of files with complete metadata/labels (0-100)';

-- =====================================================
-- STEP 4: Add readme/documentation field
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS readme_content TEXT;

COMMENT ON COLUMN datasets.readme_content IS 
'Markdown-formatted documentation about dataset structure, use cases, limitations';

-- =====================================================
-- STEP 5: Add quality indicators
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT NULL 
CHECK (quality_score >= 1 AND quality_score <= 5);

COMMENT ON COLUMN datasets.quality_score IS 
'Admin/community-assigned quality rating (1-5 stars)';

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS verified_by_curator BOOLEAN DEFAULT false;

COMMENT ON COLUMN datasets.verified_by_curator IS 
'True if reviewed and approved by Pro Curator';

-- =====================================================
-- STEP 6: Add admin review workflow fields
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'approved' 
CHECK (review_status IN ('pending', 'approved', 'rejected'));

COMMENT ON COLUMN datasets.review_status IS 
'Admin review status for raw uploads from non-Pro-Curators:
- pending: Awaiting admin review (not listed publicly)
- approved: Reviewed and approved for marketplace
- rejected: Does not meet quality/content standards';

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);

COMMENT ON COLUMN datasets.reviewed_by IS 
'Admin user who reviewed this raw upload';

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN datasets.reviewed_at IS 
'Timestamp when admin review was completed';

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS review_notes TEXT;

COMMENT ON COLUMN datasets.review_notes IS 
'Internal notes from admin about why dataset was approved/rejected';

-- =====================================================
-- STEP 7: Add curation upgrade tracking
-- =====================================================

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS original_curation_level TEXT;

COMMENT ON COLUMN datasets.original_curation_level IS 
'Original level if dataset was upgraded (raw→partial or partial→curated)';

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN datasets.upgraded_at IS 
'Timestamp when curation level was upgraded';

-- =====================================================
-- STEP 8: Update existing datasets (backward compatible)
-- =====================================================

-- Set all existing datasets to 'curated' and 'approved' (backward compatible)
UPDATE datasets 
SET curation_level = 'curated',
    metadata_completeness = 100,
    review_status = 'approved'
WHERE curation_level IS NULL;

-- =====================================================
-- STEP 9: Create indexes for filtering and admin dashboard
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_datasets_curation_level 
ON datasets(curation_level);

CREATE INDEX IF NOT EXISTS idx_datasets_review_status 
ON datasets(review_status);

CREATE INDEX IF NOT EXISTS idx_datasets_review_status_created 
ON datasets(review_status, created_at);


CREATE INDEX IF NOT EXISTS idx_datasets_quality_score 
ON datasets(quality_score);

CREATE INDEX IF NOT EXISTS idx_datasets_verified 
ON datasets(verified_by_curator);

-- =====================================================
-- STEP 10: Add RLS policies for admin review access
-- =====================================================

-- Only admins can see pending/rejected datasets
CREATE POLICY "Admins can view all datasets" ON datasets
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  OR review_status = 'approved'
);

-- Creators can view their own pending/rejected datasets
CREATE POLICY "Creators can view own datasets" ON datasets
FOR SELECT
USING (
  creator_id = auth.uid()
);

-- Public can only see approved datasets
CREATE POLICY "Public can view approved datasets" ON datasets
FOR SELECT
USING (
  review_status = 'approved' AND is_active = true
);

COMMIT;
```

### Schema Validation Checklist
- [ ] All CHECK constraints are valid
- [ ] Default values are appropriate
- [ ] Comments are clear and descriptive
- [ ] Indexes are created for frequently filtered columns
- [ ] No breaking changes to existing queries
- [ ] Migration is idempotent (can run multiple times safely)
- [ ] RLS policies restrict pending/rejected datasets to admins and creators

---

## UI/UX Design

### Visual Language

#### Curation Level Badges

**Design Pattern: Neobrutalism with Color Coding**

```jsx
// Raw Data Badge
<span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-200 border-2 border-black rounded-full font-bold text-sm">
  📦 Raw Data
</span>

// Partial Curation Badge
<span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-300 border-2 border-black rounded-full font-bold text-sm">
  🏗️ Partially Curated
</span>

// Fully Curated Badge
<span className="inline-flex items-center gap-1 px-3 py-1 bg-green-300 border-2 border-black rounded-full font-bold text-sm">
  🏷️ Fully Curated
</span>

// Pro Curator Verified Badge
<span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-300 border-2 border-black rounded-full font-bold text-sm">
  ✓ Verified
</span>
```

#### Quality Indicators

```jsx
// Star Rating Component
<div className="flex items-center gap-1">
  {[1, 2, 3, 4, 5].map((star) => (
    <Star 
      key={star}
      className={`h-4 w-4 ${star <= qualityScore ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
    />
  ))}
  <span className="text-sm font-semibold ml-1">({qualityScore}/5)</span>
</div>

// Metadata Completeness Bar
<div className="flex items-center gap-2">
  <span className="text-xs font-bold">Metadata:</span>
  <div className="flex-1 h-2 bg-gray-200 border border-black rounded-full overflow-hidden">
    <div 
      className="h-full bg-green-400 border-r border-black"
      style={{ width: `${metadataCompleteness}%` }}
    />
  </div>
  <span className="text-xs font-bold">{metadataCompleteness}%</span>
</div>
```

### Page Layout Changes

#### Homepage Reorganization

**Current Structure:**
```
Homepage
├── Hero Section
├── Philosophy
├── How It Works
├── Featured Datasets
├── Data Curation Guide (VERY LONG) ← MOVE THIS
├── Pro Curator Section
└── CTA
```

**New Structure:**
```
Homepage
├── Hero Section
├── Philosophy
├── How It Works (3 cards)
├── Featured Datasets (with curation badges)
├── Quick Guide Teaser (3-sentence summary)
│   └── [Learn More →] button to /resources
├── Pro Curator Section
└── CTA

New Resources Page (/resources)
├── Navigation tabs: [Data Curation Guide] [API Docs] [Best Practices]
├── Complete Data Curation Guide (moved from homepage)
├── New sections:
│   ├── Raw vs Curated Data
│   ├── When to Use Each
│   └── Upgrade Paths
```

---

## Component Updates

### 1. DatasetUploadModal.jsx (Major Update)

**New State Variables:**
```jsx
const [curationLevel, setCurationLevel] = useState('curated')
const [metadataCompleteness, setMetadataCompleteness] = useState(100)
const [samplePreviewFiles, setSamplePreviewFiles] = useState([])
const [readmeContent, setReadmeContent] = useState('')
```

**New UI Sections:**

**Step 1: Choose Upload Type**
```jsx
<div className="mb-6">
  <h3 className="font-extrabold mb-3">What type of data are you uploading?</h3>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Raw Data Option */}
    <button
      type="button"
      onClick={() => setCurationLevel('raw')}
      className={`p-4 border-4 border-black rounded-xl ${
        curationLevel === 'raw' 
          ? 'bg-orange-200 shadow-[4px_4px_0_#000]' 
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="text-3xl mb-2">📦</div>
      <div className="font-extrabold mb-1">Raw Data</div>
      <p className="text-xs text-black/70">
        Unprocessed files, no labels yet
      </p>
      <p className="text-xs text-green-700 mt-2 font-bold">
        Easiest • Fastest
      </p>
    </button>

    {/* Partial Curation Option */}
    <button
      type="button"
      onClick={() => setCurationLevel('partial')}
      className={`p-4 border-4 border-black rounded-xl ${
        curationLevel === 'partial' 
          ? 'bg-yellow-300 shadow-[4px_4px_0_#000]' 
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="text-3xl mb-2">🏗️</div>
      <div className="font-extrabold mb-1">Partially Curated</div>
      <p className="text-xs text-black/70">
        Some labels/organization done
      </p>
      <p className="text-xs text-blue-700 mt-2 font-bold">
        Good Balance
      </p>
    </button>

    {/* Fully Curated Option */}
    <button
      type="button"
      onClick={() => setCurationLevel('curated')}
      className={`p-4 border-4 border-black rounded-xl ${
        curationLevel === 'curated' 
          ? 'bg-green-300 shadow-[4px_4px_0_#000]' 
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="text-3xl mb-2">🏷️</div>
      <div className="font-extrabold mb-1">Fully Curated</div>
      <p className="text-xs text-black/70">
        Labeled, cleaned, ready to use
      </p>
      <p className="text-xs text-purple-700 mt-2 font-bold">
        Premium • Recommended
      </p>
    </button>
  </div>

  {/* Info Box Based on Selection */}
  {curationLevel === 'raw' && (
    <div className="mt-4 p-4 bg-orange-100 border-2 border-orange-500 rounded-xl">
      <p className="text-sm font-semibold">
        <strong>📦 Raw Data:</strong> Upload your files as-is. Great for researchers who want 
        to do their own labeling. Typically sells for 20-40% of curated equivalent.
      </p>
      <p className="text-xs text-orange-900 mt-2">
        💡 Tip: Consider posting a <a href="#" className="underline">curation request</a> to 
        partner with a Pro Curator and increase your earnings!
      </p>
    </div>
  )}

  {curationLevel === 'partial' && (
    <div className="mt-4 p-4 bg-yellow-100 border-2 border-yellow-600 rounded-xl">
      <p className="text-sm font-semibold">
        <strong>🏗️ Partially Curated:</strong> You've done some organization or labeling. 
        Buyers appreciate the head start! Price between raw and fully curated.
      </p>
    </div>
  )}

  {curationLevel === 'curated' && (
    <div className="mt-4 p-4 bg-green-100 border-2 border-green-600 rounded-xl">
      <p className="text-sm font-semibold">
        <strong>🏷️ Fully Curated:</strong> Every file is labeled and ready for AI training. 
        Commands premium pricing and sells fastest!
      </p>
    </div>
  )}
</div>
```

**Step 2: Conditional Form Fields**

```jsx
{/* Metadata Completeness Slider (only for partial) */}
{curationLevel === 'partial' && (
  <div className="mb-4">
    <label className="block font-bold mb-2">
      How much of your data is labeled? *
    </label>
    <input
      type="range"
      min="0"
      max="100"
      value={metadataCompleteness}
      onChange={(e) => setMetadataCompleteness(parseInt(e.target.value))}
      className="w-full"
    />
    <div className="flex justify-between text-sm font-semibold mt-1">
      <span>None (0%)</span>
      <span className="text-lg font-extrabold">{metadataCompleteness}%</span>
      <span>All (100%)</span>
    </div>
  </div>
)}

{/* Sample Preview Upload (required for raw/partial) */}
{curationLevel !== 'curated' && (
  <div className="mb-4">
    <label className="block font-bold mb-2">
      Sample Preview Files * (5-10 examples)
    </label>
    <p className="text-xs text-black/60 mb-2">
      Upload a few representative files so buyers can preview before purchasing
    </p>
    <input
      type="file"
      multiple
      accept="image/*,audio/*,video/*,.txt,.csv,.json"
      onChange={handleSamplePreviewUpload}
      className="w-full"
    />
    {samplePreviewFiles.length > 0 && (
      <p className="text-sm font-semibold text-green-700 mt-2">
        ✓ {samplePreviewFiles.length} sample files selected
      </p>
    )}
  </div>
)}

{/* README Content (recommended for all, required for raw) */}
<div className="mb-4">
  <label className="block font-bold mb-2">
    README / Documentation {curationLevel === 'raw' && '*'}
  </label>
  <p className="text-xs text-black/60 mb-2">
    Describe your data structure, file formats, potential use cases, and any limitations
  </p>
  <textarea
    value={readmeContent}
    onChange={(e) => setReadmeContent(e.target.value)}
    rows={6}
    className="w-full px-4 py-3 border-2 border-black rounded-lg"
    placeholder="Example: This dataset contains 500 RAW garden plant photos taken during summer 2025. No labels included. Mixed lighting conditions. Potential use: plant species classification, agricultural AI."
    required={curationLevel === 'raw'}
  />
</div>
```

**Step 3: Price Guidance**

```jsx
{/* Dynamic Price Suggestions */}
<div className="mb-4">
  <label className="block font-bold mb-2">Price (USD) *</label>
  
  {/* Price guidance based on curation level */}
  <div className="mb-2 p-3 bg-blue-50 border-2 border-blue-400 rounded-lg">
    <p className="text-xs font-bold text-blue-900">
      💡 Suggested Price Range for {curationLevel === 'raw' ? 'Raw Data' : curationLevel === 'partial' ? 'Partially Curated' : 'Fully Curated'}:
    </p>
    <p className="text-sm font-extrabold text-blue-700 mt-1">
      {curationLevel === 'raw' && '$5 - $25 (typically 20-40% of curated equivalent)'}
      {curationLevel === 'partial' && `$${Math.round(20 + (metadataCompleteness / 100) * 30)} - $${Math.round(40 + (metadataCompleteness / 100) * 60)} (based on ${metadataCompleteness}% completion)`}
      {curationLevel === 'curated' && '$50 - $150+ (premium pricing for ready-to-use data)'}
    </p>
  </div>

  <input
    type="number"
    step="0.01"
    min="0"
    value={price}
    onChange={(e) => setPrice(e.target.value)}
    className="w-full px-4 py-3 border-2 border-black rounded-lg"
    placeholder="0.00"
    required
  />
</div>
```

### 2. Create CurationLevelBadge Component

```jsx
// filepath: src/components/CurationLevelBadge.jsx

import { Package, Wrench, Tag, Check } from './Icons'

export function CurationLevelBadge({ level, verified = false, size = 'md' }) {
  const config = {
    raw: {
      icon: Package,
      label: 'Raw Data',
      bg: 'bg-orange-200',
      text: 'text-orange-900',
      description: 'Unprocessed, no labels'
    },
    partial: {
      icon: Wrench,
      label: 'Partially Curated',
      bg: 'bg-yellow-300',
      text: 'text-yellow-900',
      description: 'Some organization done'
    },
    curated: {
      icon: Tag,
      label: 'Fully Curated',
      bg: 'bg-green-300',
      text: 'text-green-900',
      description: 'Ready for AI training'
    }
  }

  const { icon: Icon, label, bg, text, description } = config[level] || config.curated

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 ${bg} border-2 border-black rounded-full font-bold ${sizeClasses[size]} ${text}`}>
        <Icon className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
        {label}
      </span>
      
      {verified && (
        <span className="inline-flex items-center gap-1 bg-purple-300 border-2 border-black rounded-full font-bold text-xs px-2 py-1 text-purple-900">
          <Check className="h-3 w-3" />
          Verified
        </span>
      )}
    </div>
  )
}
```

### 3. Update DatasetCard Component

```jsx
// Add to DatasetCard.jsx

import { CurationLevelBadge } from './CurationLevelBadge'

// In the card header (after price):
<div className="flex items-center justify-between mb-3">
  <div className="flex items-center gap-2">
    <CurationLevelBadge 
      level={dataset.curation_level} 
      verified={dataset.verified_by_curator}
      size="sm"
    />
    
    {/* Quality Score Stars */}
    {dataset.quality_score && (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            className={`h-3 w-3 ${star <= dataset.quality_score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )}
  </div>
</div>

{/* Metadata Completeness (for partial curation) */}
{dataset.curation_level === 'partial' && (
  <div className="mt-2">
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold">Labels:</span>
      <div className="flex-1 h-1.5 bg-gray-200 border border-black rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-400"
          style={{ width: `${dataset.metadata_completeness}%` }}
        />
      </div>
      <span className="text-xs font-bold">{dataset.metadata_completeness}%</span>
    </div>
  </div>
)}
```

### 4. Create ResourcesPage Component

```jsx
// filepath: src/pages/ResourcesPage.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Code, Lightbulb, Rocket, ArrowLeft } from '../components/Icons'

export default function ResourcesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('getting-started')

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 text-black p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-bold hover:text-pink-600 transition mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Home
        </button>

        <h1 className="text-4xl sm:text-6xl font-extrabold mb-4">
          📚 Getting Started with SETIQUE
        </h1>
        <p className="text-lg font-semibold text-black/80">
          Learn data curation fundamentals, platform features, and tips for success
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('getting-started')}
            className={`flex items-center gap-2 px-6 py-3 font-extrabold border-4 border-black rounded-lg transition ${
              activeTab === 'getting-started'
                ? 'bg-purple-400 shadow-[4px_4px_0_#000]'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Rocket className="h-5 w-5" />
            Getting Started Guide
          </button>

          <button
            onClick={() => setActiveTab('data-concepts')}
            className={`flex items-center gap-2 px-6 py-3 font-extrabold border-4 border-black rounded-lg transition ${
              activeTab === 'data-concepts'
                ? 'bg-purple-400 shadow-[4px_4px_0_#000]'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            Data Curation Concepts
          </button>

          <button
            onClick={() => setActiveTab('raw-vs-curated')}
            className={`flex items-center gap-2 px-6 py-3 font-extrabold border-4 border-black rounded-lg transition ${
              activeTab === 'raw-vs-curated'
                ? 'bg-purple-400 shadow-[4px_4px_0_#000]'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Lightbulb className="h-5 w-5" />
            Raw vs Curated Data
          </button>

          <button
            onClick={() => setActiveTab('tips-success')}
            className={`flex items-center gap-2 px-6 py-3 font-extrabold border-4 border-black rounded-lg transition ${
              activeTab === 'tips-success'
                ? 'bg-purple-400 shadow-[4px_4px_0_#000]'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Code className="h-5 w-5" />
            Tips for Success
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'getting-started' && <GettingStartedContent />}
        {activeTab === 'data-concepts' && <DataConceptsContent />}
        {activeTab === 'raw-vs-curated' && <RawVsCuratedContent />}
        {activeTab === 'tips-success' && <TipsForSuccessContent />}
      </div>
    </div>
  )
}

// NEW: Platform overview and quick start
function GettingStartedContent() {
  return (
    <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-8 space-y-8">
      <h2 className="text-3xl font-extrabold mb-6">
        🚀 Welcome to SETIQUE!
      </h2>
      
      <p className="text-lg font-semibold">
        SETIQUE is a marketplace where creators monetize their data and AI builders find quality training datasets. 
        Whether you have raw photos, audio clips, documents, or fully curated datasets—you can earn here.
      </p>

      {/* Platform Features */}
      <div className="bg-yellow-100 border-4 border-black rounded-xl p-6">
        <h3 className="text-2xl font-extrabold mb-4">🎯 Platform Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border-2 border-black rounded-lg p-4">
            <h4 className="font-bold text-lg mb-2">📦 Upload Datasets</h4>
            <p className="text-sm">List raw, partially curated, or fully curated datasets. Set your own prices.</p>
          </div>
          <div className="bg-white border-2 border-black rounded-lg p-4">
            <h4 className="font-bold text-lg mb-2">🔍 Browse Marketplace</h4>
            <p className="text-sm">Filter by modality, curation level, price range. Preview before purchasing.</p>
          </div>
          <div className="bg-white border-2 border-black rounded-lg p-4">
            <h4 className="font-bold text-lg mb-2">🤝 Request Curation</h4>
            <p className="text-sm">Have raw data? Hire a Pro Curator to label and organize it for you.</p>
          </div>
          <div className="bg-white border-2 border-black rounded-lg p-4">
            <h4 className="font-bold text-lg mb-2">💼 Become Pro Curator</h4>
            <p className="text-sm">Apply to curate datasets for others. Earn 40% revenue share on partnerships.</p>
          </div>
        </div>
      </div>

      {/* Quick Start Steps */}
      <div className="bg-gradient-to-r from-pink-100 to-cyan-100 border-4 border-black rounded-xl p-6">
        <h3 className="text-2xl font-extrabold mb-4">⚡ Quick Start (5 Minutes)</h3>
        <ol className="space-y-3 list-decimal list-inside font-semibold">
          <li><strong>Create an account</strong> - Sign up with email or GitHub</li>
          <li><strong>Complete your profile</strong> - Add bio, avatar, social links</li>
          <li><strong>Choose your path:</strong>
            <ul className="ml-8 mt-2 space-y-1 text-sm list-disc list-inside">
              <li><strong>Data Seller:</strong> Click "Upload Dataset" and choose Raw, Partial, or Curated</li>
              <li><strong>Data Buyer:</strong> Browse marketplace, filter by needs, purchase datasets</li>
              <li><strong>Pro Curator:</strong> Apply for Pro status, browse curation requests</li>
            </ul>
          </li>
          <li><strong>Review guidelines</strong> - Read the tabs above to understand curation levels and best practices</li>
          <li><strong>Start earning!</strong> - List your first dataset or complete your first curation request</li>
        </ol>
      </div>

      {/* Success Tips Teaser */}
      <div className="bg-purple-100 border-4 border-black rounded-xl p-6">
        <h3 className="text-2xl font-extrabold mb-3">💡 Pro Tips</h3>
        <ul className="space-y-2 text-sm font-semibold">
          <li>✓ <strong>Raw uploads:</strong> Perfect for getting started—just need sample previews + README</li>
          <li>✓ <strong>Admin review:</strong> Non-Pro-Curators' raw uploads reviewed within 24-48 hours</li>
          <li>✓ <strong>Upgrade path:</strong> Start with raw data → request curation → earn 40% when it sells as curated!</li>
          <li>✓ <strong>Pricing guidance:</strong> Raw ($5-25), Partial ($20-60), Curated ($50-150+)</li>
          <li>✓ <strong>Pro Curator fast-track:</strong> Approved Pro Curators skip admin review for raw uploads</li>
        </ul>
      </div>
    </div>
  )
}

// Move existing data curation guide content here
function DataConceptsContent() {
  return (
    <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-8">
      <h2 className="text-3xl font-extrabold mb-6">
        📚 Data Curation Fundamentals
      </h2>
      
      <p className="text-lg font-semibold mb-6">
        Data curation is the process of organizing, labeling, and preparing raw data for AI/ML training. 
        Learn the basics to create valuable datasets.
      </p>

      {/* Entire guide content from HomePage lines 550-1100 goes here */}
      {/* This includes: what is curation, modalities, labeling techniques, file formats, etc. */}
      
      <div className="space-y-8">
        <div className="bg-yellow-100 border-4 border-black rounded-xl p-6">
          <h3 className="text-2xl font-extrabold mb-4">🎓 What is Data Curation?</h3>
          <p className="font-semibold mb-4">
            Data curation transforms raw, unorganized data into structured, labeled datasets ready for machine learning. 
            It involves:
          </p>
          <ul className="space-y-2 list-disc list-inside font-semibold">
            <li><strong>Organization:</strong> Structuring files into logical folders/categories</li>
            <li><strong>Labeling:</strong> Adding metadata, annotations, or tags to each data point</li>
            <li><strong>Quality Control:</strong> Removing duplicates, fixing errors, standardizing formats</li>
            <li><strong>Documentation:</strong> Creating README files explaining dataset structure and use cases</li>
          </ul>
        </div>

        {/* Add more sections from current homepage guide */}
        {/* ... modalities, formats, examples, etc ... */}
      </div>
    </div>
  )
}

// Existing content explaining raw vs curated
function RawVsCuratedContent() {
  return (
    <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-8 space-y-8">
      <h2 className="text-3xl font-extrabold mb-6">
        🎯 Understanding Raw vs Curated Data
      </h2>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-4 border-black">
          <thead>
            <tr className="bg-gradient-to-r from-yellow-300 to-pink-300 border-b-4 border-black">
              <th className="p-4 text-left font-extrabold border-r-4 border-black">Feature</th>
              <th className="p-4 text-left font-extrabold border-r-4 border-black">📦 Raw Data</th>
              <th className="p-4 text-left font-extrabold border-r-4 border-black">🏗️ Partially Curated</th>
              <th className="p-4 text-left font-extrabold">🏷️ Fully Curated</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b-2 border-black">
              <td className="p-4 font-bold border-r-4 border-black bg-gray-100">Labels/Metadata</td>
              <td className="p-4 border-r-4 border-black">❌ None</td>
              <td className="p-4 border-r-4 border-black">⚠️ Some (20-80%)</td>
              <td className="p-4">✅ Complete</td>
            </tr>
            <tr className="border-b-2 border-black">
              <td className="p-4 font-bold border-r-4 border-black bg-gray-100">Typical Price</td>
              <td className="p-4 border-r-4 border-black">$5-25</td>
              <td className="p-4 border-r-4 border-black">$20-60</td>
              <td className="p-4">$50-150+</td>
            </tr>
            <tr className="border-b-2 border-black">
              <td className="p-4 font-bold border-r-4 border-black bg-gray-100">Upload Time</td>
              <td className="p-4 border-r-4 border-black">⚡ 5-10 min</td>
              <td className="p-4 border-r-4 border-black">🕐 1-2 hours</td>
              <td className="p-4">🕑 4-8 hours</td>
            </tr>
            <tr className="border-b-2 border-black">
              <td className="p-4 font-bold border-r-4 border-black bg-gray-100">Best For</td>
              <td className="p-4 border-r-4 border-black">Researchers who label themselves</td>
              <td className="p-4 border-r-4 border-black">Budget-conscious buyers</td>
              <td className="p-4">Production AI systems</td>
            </tr>
            <tr>
              <td className="p-4 font-bold border-r-4 border-black bg-gray-100">Upgrade Path</td>
              <td className="p-4 border-r-4 border-black">→ Post curation request</td>
              <td className="p-4 border-r-4 border-black">→ Finish labeling</td>
              <td className="p-4">✓ Ready to sell</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* When to Choose Each */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-orange-100 border-4 border-black rounded-xl p-6">
          <h3 className="text-xl font-extrabold mb-3">📦 Choose Raw Data If:</h3>
          <ul className="space-y-2 text-sm font-semibold">
            <li>✓ You have lots of files but no time to label</li>
            <li>✓ You want to get started fast</li>
            <li>✓ Your data is rare/unique (value in rarity)</li>
            <li>✓ You plan to request Pro Curator help later</li>
          </ul>
        </div>

        <div className="bg-yellow-100 border-4 border-black rounded-xl p-6">
          <h3 className="text-xl font-extrabold mb-3">🏗️ Choose Partial If:</h3>
          <ul className="space-y-2 text-sm font-semibold">
            <li>✓ You've labeled some examples already</li>
            <li>✓ You want better pricing than raw</li>
            <li>✓ Your labeling is in progress</li>
            <li>✓ You have domain knowledge (partial = valuable)</li>
          </ul>
        </div>

        <div className="bg-green-100 border-4 border-black rounded-xl p-6">
          <h3 className="text-xl font-extrabold mb-3">🏷️ Choose Curated If:</h3>
          <ul className="space-y-2 text-sm font-semibold">
            <li>✓ Every file has complete metadata</li>
            <li>✓ You want premium pricing</li>
            <li>✓ Your data is production-ready</li>
            <li>✓ You're a Pro Curator or domain expert</li>
          </ul>
        </div>
      </div>

      {/* Upgrade Path Visualization */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-100 to-pink-100 border-4 border-black rounded-xl">
        <h3 className="text-2xl font-extrabold mb-4">🚀 The Upgrade Path</h3>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-4xl mb-2">📦</div>
            <div className="font-bold">Upload Raw</div>
            <div className="text-xs">$10 listing</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="text-4xl mb-2">🤝</div>
            <div className="font-bold">Request Curation</div>
            <div className="text-xs">Partner with Pro</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="text-4xl mb-2">🏷️</div>
            <div className="font-bold">Fully Curated</div>
            <div className="text-xs">$75 listing</div>
          </div>
          <div className="text-2xl">→</div>
          <div className="text-center">
            <div className="text-4xl mb-2">💰</div>
            <div className="font-bold">Both Earn</div>
            <div className="text-xs text-green-700">40% each!</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BestPracticesContent() {
  return (
    <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-8">
      <h2 className="text-3xl font-extrabold mb-6">
        ✨ Dataset Best Practices
      </h2>
      {/* Best practices content */}
    </div>
  )
}

// NEW: Tips for success on the platform
function TipsForSuccessContent() {
  return (
    <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-8 space-y-8">
      <h2 className="text-3xl font-extrabold mb-6">
        💼 Tips for Success on SETIQUE
      </h2>

      {/* For Data Sellers */}
      <div className="bg-green-100 border-4 border-black rounded-xl p-6">
        <h3 className="text-2xl font-extrabold mb-4">📈 For Data Sellers</h3>
        <ul className="space-y-3 list-disc list-inside font-semibold">
          <li><strong>Start with raw:</strong> Don't wait for perfection. Upload raw data to test market interest.</li>
          <li><strong>Write great READMEs:</strong> Explain what's in your dataset, file formats, use cases, limitations.</li>
          <li><strong>Provide 5-10 sample previews:</strong> Help buyers understand quality before purchasing.</li>
          <li><strong>Price competitively:</strong> Check similar datasets in your modality. Raw = $5-25, Curated = $50-150+.</li>
          <li><strong>Use the upgrade path:</strong> Raw → Request Curation → Split revenue 40/40 with Pro Curator.</li>
          <li><strong>Respond to feedback:</strong> If admin rejects your upload, read the notes and resubmit improved version.</li>
          <li><strong>Build reputation:</strong> Consistent quality leads to repeat buyers and higher trust levels.</li>
        </ul>
      </div>

      {/* For Pro Curators */}
      <div className="bg-purple-100 border-4 border-black rounded-xl p-6">
        <h3 className="text-2xl font-extrabold mb-4">🎯 For Pro Curators</h3>
        <ul className="space-y-3 list-disc list-inside font-semibold">
          <li><strong>Browse curation requests:</strong> Raw data owners need your expertise—earn 40% on upgrades.</li>
          <li><strong>Communicate clearly:</strong> Set expectations on timeline, labeling process, final quality.</li>
          <li><strong>Pro status benefits:</strong> Skip admin review on raw uploads, get badge, higher visibility.</li>
          <li><strong>Specialize:</strong> Become known for a specific modality (audio, images, text, etc.).</li>
          <li><strong>Document your process:</strong> Show before/after examples to attract more requests.</li>
          <li><strong>Offer bundles:</strong> Curate multiple datasets for one client at discounted rate.</li>
        </ul>
      </div>

      {/* For Data Buyers */}
      <div className="bg-cyan-100 border-4 border-black rounded-xl p-6">
        <h3 className="text-2xl font-extrabold mb-4">🔍 For Data Buyers</h3>
        <ul className="space-y-3 list-disc list-inside font-semibold">
          <li><strong>Filter by curation level:</strong> Raw = DIY labeling, Curated = ready for training.</li>
          <li><strong>Check sample previews:</strong> Always review samples before purchasing raw/partial datasets.</li>
          <li><strong>Look for verification badges:</strong> Purple "Verified" badge = Pro Curator reviewed.</li>
          <li><strong>Read READMEs carefully:</strong> Understand limitations, file formats, licensing before buying.</li>
          <li><strong>Contact sellers:</strong> Ask questions about dataset structure, quality, or custom formats.</li>
          <li><strong>Leave reviews:</strong> Help the community by rating quality after purchase.</li>
          <li><strong>Request custom curation:</strong> Need specific labels? Post a curation request with your requirements.</li>
        </ul>
      </div>

      {/* Common Mistakes to Avoid */}
      <div className="bg-red-100 border-4 border-black rounded-xl p-6">
        <h3 className="text-2xl font-extrabold mb-4">⚠️ Common Mistakes to Avoid</h3>
        <ul className="space-y-3 list-disc list-inside font-semibold">
          <li>❌ <strong>Mislabeling curation level:</strong> Don't mark raw data as "curated"—it will be rejected.</li>
          <li>❌ <strong>Skipping sample previews:</strong> Raw uploads without samples won't sell well.</li>
          <li>❌ <strong>Vague descriptions:</strong> "Image dataset" isn't enough—specify content, size, quality.</li>
          <li>❌ <strong>Overpricing raw data:</strong> Unlabeled data should be priced $5-25, not $100+.</li>
          <li>❌ <strong>Ignoring file formats:</strong> Use standard formats (CSV, JSON, PNG, WAV) for compatibility.</li>
          <li>❌ <strong>No README:</strong> Raw uploads require documentation—explain what buyers are getting.</li>
          <li>❌ <strong>Copyrighted content:</strong> Only upload data you own rights to or have permission to share.</li>
        </ul>
      </div>

      {/* Admin Review Tips */}
      <div className="bg-yellow-100 border-4 border-black rounded-xl p-6">
        <h3 className="text-2xl font-extrabold mb-4">✅ Admin Review Tips (Non-Pro-Curators)</h3>
        <p className="font-semibold mb-4">
          Your first raw upload will be reviewed within 24-48 hours. Here's what admins check:
        </p>
        <ul className="space-y-2 list-disc list-inside font-semibold">
          <li>✓ Sample previews are representative of full dataset</li>
          <li>✓ README accurately describes content and structure</li>
          <li>✓ No copyrighted or inappropriate content</li>
          <li>✓ File formats are standard and accessible</li>
          <li>✓ Pricing is reasonable for curation level</li>
          <li>✓ Dataset title and description are clear</li>
        </ul>
        <div className="mt-4 p-4 bg-white border-2 border-black rounded-lg">
          <strong>Pro tip:</strong> Once you become a Pro Curator, your raw uploads skip review and go live immediately!
        </div>
      </div>
    </div>
  )
}
```

### 5. Update HomePage.jsx

**Remove Data Curation Guide Section (lines ~550-1100)**

**Add Quick Teaser Instead:**

```jsx
{/* Getting Started Guide Teaser - replaces full guide */}
<section className="max-w-5xl mx-auto mb-24">
  <div className="bg-gradient-to-br from-yellow-200 via-pink-200 to-cyan-200 border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-8 text-center">
    <h3 className="text-3xl font-extrabold mb-4">
      � New to SETIQUE?
    </h3>
    <p className="text-lg font-semibold mb-6 text-black/80">
      Learn data curation fundamentals, platform features, and tips for success. 
      Whether you have raw photos, audio files, or fully labeled datasets—start earning here.
    </p>
    
    <div className="grid md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border-2 border-black rounded-xl p-4">
        <div className="text-3xl mb-2">�</div>
        <div className="font-bold">Platform Guide</div>
        <div className="text-sm text-black/70">Quick start steps</div>
      </div>
      <div className="bg-white border-2 border-black rounded-xl p-4">
        <div className="text-3xl mb-2">🎓</div>
        <div className="font-bold">Curation Basics</div>
        <div className="text-sm text-black/70">Learn the concepts</div>
      </div>
      <div className="bg-white border-2 border-black rounded-xl p-4">
        <div className="text-3xl mb-2">📦</div>
        <div className="font-bold">Raw vs Curated</div>
        <div className="text-sm text-black/70">Choose your path</div>
      </div>
      <div className="bg-white border-2 border-black rounded-xl p-4">
        <div className="text-3xl mb-2">💡</div>
        <div className="font-bold">Success Tips</div>
        <div className="text-sm text-black/70">Pro strategies</div>
      </div>
    </div>

    <Link 
      to="/resources"
      className="inline-flex items-center gap-2 px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white font-extrabold rounded-xl border-4 border-black shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] transition"
    >
      Read Complete Getting Started Guide
      <ArrowRight className="h-5 w-5" />
    </Link>

    <p className="text-sm font-semibold mt-4 text-black/70">
      ⚡ New: Raw uploads now available! Admin review within 24-48 hours.
    </p>
  </div>
</section>
```
      </div>
      <div className="bg-white border-2 border-black rounded-xl p-4">
        <div className="text-3xl mb-2">💰</div>
        <div className="font-bold">Earn Passive Income</div>
        <div className="text-sm text-black/70">80% per sale</div>
      </div>
    </div>
    
    <button
      onClick={() => navigate('/resources')}
      className="bg-purple-400 hover:bg-purple-500 text-black font-extrabold px-8 py-4 rounded-full border-4 border-black shadow-[6px_6px_0_#000] hover:shadow-[8px_8px_0_#000] transition-all text-lg"
    >
      📖 Read the Complete Guide →
    </button>
  </div>
</section>
```

### 6. Add Marketplace Filters

```jsx
// In DatasetsPage.jsx or marketplace component

<div className="mb-6">
  <h3 className="font-bold mb-2">Curation Level</h3>
  <div className="flex flex-wrap gap-2">
    <button
      onClick={() => setFilterCuration('all')}
      className={`px-4 py-2 border-2 border-black rounded-lg font-semibold ${
        filterCuration === 'all' ? 'bg-purple-400' : 'bg-white'
      }`}
    >
      All Levels
    </button>
    <button
      onClick={() => setFilterCuration('curated')}
      className={`px-4 py-2 border-2 border-black rounded-lg font-semibold ${
        filterCuration === 'curated' ? 'bg-green-300' : 'bg-white'
      }`}
    >
      🏷️ Curated Only
    </button>
    <button
      onClick={() => setFilterCuration('partial')}
      className={`px-4 py-2 border-2 border-black rounded-lg font-semibold ${
        filterCuration === 'partial' ? 'bg-yellow-300' : 'bg-white'
      }`}
    >
      🏗️ Partially Curated
    </button>
    <button
      onClick={() => setFilterCuration('raw')}
      className={`px-4 py-2 border-2 border-black rounded-lg font-semibold ${
        filterCuration === 'raw' ? 'bg-orange-200' : 'bg-white'
      }`}
    >
      📦 Raw Data
    </button>
  </div>
</div>

{/* Query logic */}
let query = supabase
  .from('datasets')
  .select('*')

if (filterCuration !== 'all') {
  query = query.eq('curation_level', filterCuration)
}
```

---

## Logic & Business Rules

### Price Validation Rules

```javascript
// Price validation based on curation level
const validatePrice = (price, curationLevel, fileSize) => {
  const numPrice = parseFloat(price)
  
  // Minimum prices by level
  const minimums = {
    raw: 0,      // Can be free
    partial: 5,   // Minimum $5
    curated: 10   // Minimum $10
  }
  
  // Suggested ranges
  const ranges = {
    raw: { min: 5, max: 25 },
    partial: { min: 20, max: 60 },
    curated: { min: 50, max: 150 }
  }
  
  if (numPrice < minimums[curationLevel]) {
    return {
      valid: false,
      message: `${curationLevel} datasets require minimum $${minimums[curationLevel]}`
    }
  }
  
  // Warning if outside suggested range
  const range = ranges[curationLevel]
  if (numPrice < range.min || numPrice > range.max) {
    return {
      valid: true,
      warning: `Suggested range: $${range.min}-$${range.max}. Your price may affect sales.`
    }
  }
  
  return { valid: true }
}
```

### Sample Preview Requirements

```javascript
// Sample preview upload validation
const validateSamplePreviews = (files, curationLevel, mainDatasetSize) => {
  if (curationLevel === 'curated') {
    return { valid: true } // Optional for curated
  }
  
  if (files.length < 3) {
    return {
      valid: false,
      message: 'Raw and partial datasets require at least 3 sample preview files'
    }
  }
  
  if (files.length > 10) {
    return {
      valid: false,
      message: 'Maximum 10 sample preview files allowed'
    }
  }
  
  // Check file sizes (max 5MB each)
  const oversized = files.filter(f => f.size > 5 * 1024 * 1024)
  if (oversized.length > 0) {
    return {
      valid: false,
      message: 'Sample files must be under 5MB each (use thumbnails/excerpts)'
    }
  }
  
  return { valid: true }
}
```

### README Content Requirements

```javascript
// README validation
const validateReadme = (readme, curationLevel) => {
  if (curationLevel === 'raw' && !readme) {
    return {
      valid: false,
      message: 'Raw datasets must include README documentation'
    }
  }
  
  if (readme && readme.length < 100) {
    return {
      valid: false,
      message: 'README must be at least 100 characters (describe your data!)'
    }
  }
  
  // Check for key sections
  const requiredKeywords = ['format', 'files', 'use']
  const hasKeywords = requiredKeywords.some(kw => 
    readme.toLowerCase().includes(kw)
  )
  
  if (readme && !hasKeywords) {
    return {
      valid: true,
      warning: 'Consider describing file formats, number of files, and use cases'
    }
  }
  
  return { valid: true }
}
```

### Curation Level Upgrade Logic

```javascript
// Allow dataset owner to upgrade curation level
const upgradeCurationLevel = async (datasetId, newLevel, userId) => {
  // Fetch current dataset
  const { data: dataset, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('id', datasetId)
    .single()
  
  if (error || dataset.creator_id !== userId) {
    throw new Error('Unauthorized or dataset not found')
  }
  
  // Validate upgrade path (can't downgrade)
  const levels = ['raw', 'partial', 'curated']
  const currentIndex = levels.indexOf(dataset.curation_level)
  const newIndex = levels.indexOf(newLevel)
  
  if (newIndex <= currentIndex) {
    throw new Error('Can only upgrade curation level (raw→partial→curated)')
  }
  
  // Update dataset
  const { error: updateError } = await supabase
    .from('datasets')
    .update({
      curation_level: newLevel,
      original_curation_level: dataset.original_curation_level || dataset.curation_level,
      upgraded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', datasetId)
  
  if (updateError) throw updateError
  
  // Log activity
  await logDatasetUpgraded(userId, datasetId, dataset.curation_level, newLevel)
  
  return { success: true }
}
```

### Admin Review Workflow (Non-Pro-Curators Only)

```javascript
// Handle raw upload submission
const handleRawUpload = async (datasetData, userId) => {
  // Check if user is Pro Curator
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro_curator')
    .eq('id', userId)
    .single()
  
  // Determine review status
  const reviewStatus = profile?.is_pro_curator ? 'approved' : 'pending'
  
  // Insert dataset with appropriate review status
  const { data: dataset, error } = await supabase
    .from('datasets')
    .insert({
      ...datasetData,
      creator_id: userId,
      review_status: reviewStatus,
      is_active: reviewStatus === 'approved' // Only active if auto-approved
    })
    .select()
    .single()
  
  // Notify user of review requirement
  if (reviewStatus === 'pending') {
    await sendNotification({
      user_id: userId,
      type: 'dataset_pending_review',
      title: 'Dataset Submitted for Review',
      message: 'Your raw upload is being reviewed by our team. You\'ll be notified when it\'s approved.',
      link: `/datasets/${dataset.id}`
    })
    
    // Notify admins
    await notifyAdminsOfPendingReview(dataset)
  }
  
  return { dataset, requiresReview: reviewStatus === 'pending' }
}

// Admin review action
const reviewDataset = async (datasetId, adminId, action, notes) => {
  if (action !== 'approve' && action !== 'reject') {
    throw new Error('Invalid action')
  }
  
  const reviewStatus = action === 'approve' ? 'approved' : 'rejected'
  
  // Update dataset
  const { data: dataset, error } = await supabase
    .from('datasets')
    .update({
      review_status: reviewStatus,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      is_active: reviewStatus === 'approved'
    })
    .eq('id', datasetId)
    .select('creator_id, title')
    .single()
  
  if (error) throw error
  
  // Notify creator
  await sendNotification({
    user_id: dataset.creator_id,
    type: `dataset_review_${action}d`,
    title: action === 'approve' ? 'Dataset Approved! 🎉' : 'Dataset Review Update',
    message: action === 'approve' 
      ? `Your dataset "${dataset.title}" is now live on the marketplace!`
      : `Your dataset "${dataset.title}" needs some adjustments. Check the feedback for details.`,
    link: `/datasets/${datasetId}`
  })
  
  return { success: true }
}

// Admin dashboard query
const getPendingReviews = async () => {
  const { data, error } = await supabase
    .from('datasets')
    .select(`
      id,
      title,
      description,
      curation_level,
      created_at,
      creator_id,
      profiles:creator_id (
        username,
        avatar_url
      )
    `)
    .eq('review_status', 'pending')
    .order('created_at', { ascending: true })
  
  return data || []
}
```

### Pro Curator Integration Logic

```javascript
// When Pro Curator completes work, upgrade dataset
const completeCurationAndUpgrade = async (submissionId, curatorId, ownerId) => {
  // Fetch submission
  const { data: submission } = await supabase
    .from('curator_submissions')
    .select('*, curation_requests(*)')
    .eq('id', submissionId)
    .single()
  
  // If there's an existing raw dataset, upgrade it
  if (submission.curation_requests.original_dataset_id) {
    await upgradeCurationLevel(
      submission.curation_requests.original_dataset_id,
      'curated',
      ownerId
    )
    
    // Link to partnership
    await supabase
      .from('dataset_partnerships')
      .insert({
        dataset_id: submission.curation_requests.original_dataset_id,
        owner_id: ownerId,
        curator_user_id: curatorId,
        split_percentage: 50,
        status: 'active'
      })
  } else {
    // Create new curated dataset from submission
    // (existing logic)
  }
}
```

---

## Migration Strategy

### Phase 1: Database (Week 1, Day 1-2)

**Steps:**
1. ✅ Create migration file `026_curation_level_system.sql`
2. ✅ Test migration on local Supabase instance
3. ✅ Review all CHECK constraints
4. ✅ Verify indexes are created
5. ✅ Run migration on staging environment
6. ✅ Validate all existing datasets have `curation_level = 'curated'`
7. ✅ Run migration on production

**Rollback Plan:**
```sql
-- If issues occur, rollback with:
BEGIN;

DROP INDEX IF EXISTS idx_datasets_curation_level;
DROP INDEX IF EXISTS idx_datasets_quality_score;
DROP INDEX IF EXISTS idx_datasets_verified;

ALTER TABLE datasets 
DROP COLUMN IF EXISTS curation_level,
DROP COLUMN IF EXISTS sample_preview_urls,
DROP COLUMN IF EXISTS metadata_completeness,
DROP COLUMN IF EXISTS readme_content,
DROP COLUMN IF EXISTS quality_score,
DROP COLUMN IF EXISTS verified_by_curator,
DROP COLUMN IF EXISTS original_curation_level,
DROP COLUMN IF EXISTS upgraded_at;

COMMIT;
```

### Phase 2: UI Components (Week 1, Day 3-5)

**Order of Implementation:**
1. Create `CurationLevelBadge.jsx` component (30 min)
2. Update `DatasetCard.jsx` to show badges (1 hour)
3. Test badge rendering with mock data (30 min)
4. Update `DatasetUploadModal.jsx` with dual-track system (4 hours)
5. Test upload modal with all three levels (2 hours)
6. Update marketplace filters (2 hours)
7. Create `ResourcesPage.jsx` (3 hours)
8. Move curation guide content from HomePage (1 hour)
9. Update HomePage with teaser section (1 hour)
10. Update routing in `App.jsx` (30 min)

**Testing Checkpoints:**
- [ ] Badge component renders correctly for all levels
- [ ] Upload modal shows/hides fields based on selection
- [ ] Price guidance updates dynamically
- [ ] Sample preview upload works
- [ ] README textarea validation works
- [ ] Filters on marketplace work correctly
- [ ] Resources page navigation works
- [ ] Homepage teaser links to resources

### Phase 3: Pro Curator Integration (Week 2-3)

**Updates Required:**
1. Add "Upgrade my raw dataset" option in curation request modal
2. Link raw datasets to curation requests
3. Auto-upgrade dataset when curator completes work
4. Add dashboard section showing "Your raw uploads that need curation"
5. Email notifications for upgrade opportunities

### Phase 4: Testing & Refinement (Week 3-4)

**Test Scenarios:**
- [ ] Upload raw dataset → verify fields are required
- [ ] Upload partial dataset → verify slider works
- [ ] Upload curated dataset → verify optional fields work
- [ ] Filter by curation level → verify results
- [ ] View dataset detail → badges show correctly
- [ ] Purchase raw dataset → verify lower price
- [ ] Raw dataset owner posts curation request → link works
- [ ] Pro Curator upgrades dataset → partnership created
- [ ] Upgrade path from dashboard → UI is clear

---

## Testing Checklist

### Database Tests

```sql
-- Test 1: Insert raw dataset
INSERT INTO datasets (creator_id, title, description, price, modality, curation_level, metadata_completeness, readme_content)
VALUES ('test-user-id', 'Test Raw Dataset', 'Test description', 10.00, 'vision', 'raw', 0, 'This is raw data');

-- Test 2: Insert partial dataset
INSERT INTO datasets (creator_id, title, description, price, modality, curation_level, metadata_completeness)
VALUES ('test-user-id', 'Test Partial Dataset', 'Test description', 30.00, 'audio', 'partial', 60);

-- Test 3: Query by curation level
SELECT * FROM datasets WHERE curation_level = 'raw';

-- Test 4: Upgrade dataset
UPDATE datasets 
SET curation_level = 'curated',
    original_curation_level = 'raw',
    upgraded_at = NOW()
WHERE id = 'test-dataset-id';

-- Test 5: Verify constraints
INSERT INTO datasets (creator_id, title, description, price, modality, curation_level)
VALUES ('test-user-id', 'Invalid', 'Test', 10.00, 'vision', 'invalid'); -- Should FAIL

-- Test 6: Verify indexes
EXPLAIN ANALYZE SELECT * FROM datasets WHERE curation_level = 'raw';
-- Should use idx_datasets_curation_level
```

### Frontend Tests

```javascript
// Test: Badge rendering
test('CurationLevelBadge renders correctly for each level', () => {
  const { getByText } = render(<CurationLevelBadge level="raw" />)
  expect(getByText('Raw Data')).toBeInTheDocument()
})

// Test: Upload modal state management
test('Upload modal shows conditional fields based on curation level', () => {
  const { getByLabelText, queryByLabelText } = render(<DatasetUploadModal isOpen={true} />)
  
  // Select raw
  fireEvent.click(getByText('Raw Data'))
  expect(getByLabelText(/sample preview/i)).toBeInTheDocument()
  expect(getByLabelText(/readme/i)).toBeRequired()
  
  // Select curated
  fireEvent.click(getByText('Fully Curated'))
  expect(queryByLabelText(/metadata completeness/i)).not.toBeInTheDocument()
})

// Test: Marketplace filtering
test('Marketplace filters by curation level', async () => {
  render(<DatasetsPage />)
  
  // Click raw filter
  fireEvent.click(getByText('📦 Raw Data'))
  
  // Verify query includes filter
  await waitFor(() => {
    expect(mockSupabase.from).toHaveBeenCalledWith('datasets')
    expect(mockSupabase.eq).toHaveBeenCalledWith('curation_level', 'raw')
  })
})
```

### End-to-End Tests

```javascript
// Test: Complete raw upload flow
test('User can upload raw dataset with all required fields', async () => {
  // 1. Navigate to upload modal
  // 2. Select "Raw Data"
  // 3. Fill in title, description, price
  // 4. Upload main file
  // 5. Upload 5 sample previews
  // 6. Write README
  // 7. Submit
  // 8. Verify dataset created with curation_level = 'raw'
  // 9. Verify sample_preview_urls are populated
  // 10. Verify readme_content is saved
})

// Test: Upgrade path
test('Raw dataset owner can post curation request', async () => {
  // 1. Upload raw dataset
  // 2. Go to dashboard
  // 3. Click "Request Curation" on raw dataset
  // 4. Fill curation request form with link to dataset
  // 5. Submit
  // 6. Verify request is created
  // 7. Pro Curator accepts
  // 8. Curator submits work
  // 9. Owner approves
  // 10. Verify dataset upgraded to 'curated'
  // 11. Verify partnership created
})
```

---

## Rollout Plan

### Pre-Launch (1 week before)

- [ ] Complete all database migrations on staging
- [ ] Deploy all UI changes to staging
- [ ] Conduct full QA testing
- [ ] Update documentation
- [ ] Create announcement post draft
- [ ] Prepare email to existing users

### Launch Day

**Morning:**
1. Run database migration on production (9 AM)
2. Verify all existing datasets have `curation_level = 'curated'`
3. Deploy frontend changes (10 AM)
4. Monitor error logs for 1 hour
5. Test critical paths (upload, filter, view)

**Afternoon:**
6. Send announcement email to beta users (2 PM)
7. Post on social media / blog
8. Monitor user feedback
9. Be ready for hotfixes

### Post-Launch (First Week)

- [ ] Daily monitoring of error logs
- [ ] Track metrics:
  - Number of raw uploads vs curated uploads
  - Conversion rate from raw → curation request
  - Price distribution by curation level
  - User feedback on new flow
- [ ] Gather user feedback via feedback modal
- [ ] Iterate on UI based on confusion points

### Success Metrics (30 Days)

**Quantitative:**
- At least 30% of new uploads use "raw" or "partial" option
- 15% of raw dataset owners post curation requests
- 10% of raw datasets upgraded to curated via Pro Curator
- No increase in support tickets related to confusion
- Average price for raw ($10-20), partial ($30-50), curated ($60-120)

**Qualitative:**
- User feedback: "Easier to get started"
- Pro Curators: "More curation requests coming in"
- Buyers: "Love being able to filter by curation level"

---

## Risk Mitigation

### Risk 1: Marketplace Quality Dilution

**Mitigation:**
- Default marketplace sort to "Curated First"
- Prominent filters to hide raw data if desired
- Admin review for first raw upload from each user
- Quality score system to surface best content

### Risk 2: User Confusion

**Mitigation:**
- Very clear badges and labels
- In-modal explanations for each option
- Resources page with comprehensive guide
- Tooltips throughout upload process

### Risk 3: Price Cannibalization

**Mitigation:**
- Strong price guidance built into upload modal
- Education that raw = different market segment
- Emphasize upgrade path to Pro Curator partnership
- Show success stories of raw→curated upgrades

### Risk 4: Database Performance

**Mitigation:**
- Proper indexes on new columns
- Monitor query performance
- Cache frequently accessed data
- Consider materialized views if needed

---

## Appendix: File Changes Summary

### New Files to Create
1. `supabase/migrations/026_curation_level_system.sql` - Database schema with admin review
2. `src/components/CurationLevelBadge.jsx` - Badge component
3. `src/components/AdminReviewPanel.jsx` - Admin dashboard for pending reviews
4. `src/pages/ResourcesPage.jsx` - Getting Started guide with 4 tabs
5. `docs/RAW_UPLOADS_IMPLEMENTATION_PLAN.md` - This document

### Files to Modify
1. `src/components/DatasetUploadModal.jsx` - Add three-track upload + admin review logic
2. `src/components/DatasetCard.jsx` - Add badges and metadata display
3. `src/pages/HomePage.jsx` - Remove curation guide, add Getting Started teaser
4. `src/pages/DatasetsPage.jsx` - Add curation level filters + hide pending from public
5. `src/App.jsx` - Add /resources route
6. `src/lib/validation.js` - Add validation functions for raw uploads
7. `src/pages/AdminDashboard.jsx` - Add pending reviews section

### Files to Test
All modified files plus:
- `src/pages/DashboardPage.jsx` - Verify dataset list shows badges
- `src/components/DatasetDetailModal.jsx` - Show full curation info
- All marketplace components

---

## Conclusion

This implementation plan provides a complete roadmap for adding raw upload functionality to SETIQUE while:

✅ **Maintaining backward compatibility** - All existing datasets remain "curated"  
✅ **Admin review workflow** - Non-Pro-Curators' raw uploads reviewed within 24-48 hours  
✅ **Pro Curator fast-track** - Pro status holders skip review for instant publishing  
✅ **Consistent UI/UX** - Neobrutalism design language throughout  
✅ **Clear user journey** - Raw → Partial → Curated progression  
✅ **Pro Curator integration** - Natural funnel to curation requests  
✅ **Quality assurance** - Filters, badges, validation rules, and admin oversight  
✅ **Comprehensive guide** - Getting Started resources with platform tutorials  
✅ **Comprehensive testing** - Database, frontend, and E2E tests  

**Key Features:**
- **Three-tier curation system:** Raw ($5-25), Partial ($20-60), Curated ($50-150+)
- **Admin review for quality:** First raw uploads reviewed by team before going live
- **Pro Curator benefits:** Skip review, verified badge, higher visibility
- **Getting Started Guide:** 4-tab resource hub (Platform Guide, Data Concepts, Raw vs Curated, Success Tips)
- **Sample preview system:** 3-10 preview files required for raw/partial datasets
- **README requirements:** Documentation mandatory for raw uploads
- **Upgrade path tracking:** Raw datasets can progress to curated via Pro Curator partnerships

**Next Steps:**
1. Review this plan with stakeholders
2. Get approval on design decisions
3. Begin Phase 1: Database migrations (add review_status fields)
4. Build Admin Review Panel for pending dataset queue
5. Create Getting Started Guide (move + expand homepage content)
6. Proceed through phases sequentially

**Questions or concerns?** Review each section and flag any issues before beginning implementation.

---

**Document Status:** ✅ Ready for Review  
**Estimated Total Implementation Time:** 3-4 weeks  
**Last Updated:** January 2025 - Added admin review workflow and Getting Started Guide
**Risk Level:** Low (additive changes only, no breaking modifications)
