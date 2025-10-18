# Week 2 UI Testing Guide

**Status:** Week 2 components are complete but only visible during CSV upload process.

---

## 🎯 How to See Week 2 Features

### Quick Test (5 minutes)

1. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Navigate to http://localhost:3000

2. **Log in to Setique** (or create an account)

3. **Click "Upload Dataset"** button
   - Usually in dashboard header or sidebar
   - Opens the DatasetUploadModal

4. **Fill in basic fields:**
   - **Title:** "TikTok Creator Analytics Q4 2025"
   - **Description:** "Viral video performance data with extended TikTok fields"
   - **Modality:** Text
   - **Tags:** tiktok, social-media, analytics

5. **Upload the test CSV:**
   - Click **"Choose File"**
   - Select: `tests/fixtures/tiktok-sample.csv`
   - **⚡ Watch the magic happen!**

---

## ✨ What You'll See (in order)

### 1. **Loading Spinner** (1-2 seconds)
```
🔄 Analyzing your CSV...
Detecting platform, scanning for PII, calculating pricing...
```

### 2. **Schema Analysis Results** 
- **Platform Badge:** TikTok 🎵 with 92% confidence
- **Core Fields Detected:**
  - date: Post Date
  - views: Video Views  
  - likes: Likes
  - comments: Comments
  - shares: Shares
  - followers: Followers Gained
  - revenue: Estimated Earnings
- **Extended Fields Badge:** +6 Extended Fields (purple)
  - tiktok_sound_name
  - tiktok_duet_count
  - tiktok_stitch_count
  - tiktok_video_duration
  - tiktok_is_paid_partnership
  - tiktok_hashtag_names

### 3. **Version Selector** (Radio Buttons)
Three options with pricing:
- 📊 **Standard Version** - USS core fields only ($50)
- 🚀 **Extended Version** - Core + 6 platform fields ($100) [HIGHLIGHTED]
- 💎 **Both Versions** - Sell separately ($125) [RECOMMENDED]

### 4. **Hygiene Report**
- ✅ **Hygiene Check Passed**
- 0 Issues Found
- Clean Data Guarantee badge
- No PII detected (emails, phones, SSNs, credit cards, etc.)

### 5. **Pricing Suggestion Card**
- **Suggested Price:** $85.00 (88% confidence)
- **5-Factor Breakdown:**
  - Base Price (Row Count): $75
  - Date Recency: +50% (last 7 days)
  - Platform Value (TikTok): +30%
  - Extended Fields Bonus: +100% (2x multiplier!)
  - Curation Bonus: 0%
- **"Accept $85.00" Button** - Click to auto-fill price field
- AI Reasoning tooltip
- Market comparables note

---

## 🧪 Test Different Scenarios

### Scenario 1: Standard Version (No Extended Fields)
Create a CSV with only USS core fields (no TikTok-specific columns):
```csv
Date,Views,Likes,Comments,Shares,Followers,Revenue
2025-10-15,125000,8500,420,950,320,42.50
```
**Expected:** Version selector won't show (only standard available)

### Scenario 2: PII Detection
Add an email to the CSV:
```csv
Post Date,Video Views,Likes,Creator Email
2025-10-15,125000,8500,creator@tiktok.com
```
**Expected:** 
- Hygiene Report shows ⚠ 1 Issue Found
- Pattern breakdown: EMAIL (critical severity)
- Recommendations: "Email addresses have been anonymized"

### Scenario 3: Low Confidence Detection
Create a generic CSV with random columns:
```csv
field1,field2,field3
value1,value2,value3
```
**Expected:**
- Platform: OTHER (low confidence ~30%)
- No extended fields
- Lower pricing ($25-40 range)

---

## 📸 UI Components Checklist

Test each component renders correctly:

- [ ] **SchemaAnalysisResults.jsx**
  - [ ] Platform badge with correct emoji
  - [ ] Confidence score color-coded (green >80%, yellow 60-80%, red <60%)
  - [ ] Canonical fields mapping table
  - [ ] Extended fields purple badges
  - [ ] Data quality validation status

- [ ] **PricingSuggestionCard.jsx**
  - [ ] Suggested price in large text
  - [ ] Price range display
  - [ ] 5-factor breakdown with multipliers
  - [ ] Accept button works (fills price field)
  - [ ] AI reasoning tooltip
  - [ ] Market comparables note

- [ ] **VersionSelector.jsx**
  - [ ] 3 radio buttons (standard, extended, both)
  - [ ] "RECOMMENDED" badge on "Both Versions"
  - [ ] Extended fields preview (first 6 shown, +N more)
  - [ ] Pricing updates when selected
  - [ ] Benefits list for each version

- [ ] **HygieneReport.jsx**
  - [ ] Pass/fail status badge
  - [ ] Issues count
  - [ ] Expandable pattern breakdown (click to see details)
  - [ ] Severity levels color-coded
  - [ ] Recommendations section
  - [ ] Clean data guarantee (if passed)

---

## 🐛 Troubleshooting

### Components not showing?
1. **Check file type:** Must be `.csv` file (not .xlsx, .json, etc.)
2. **Check browser console:** Look for errors in DevTools (F12)
3. **Check network:** Make sure PapaParse is loaded (check Network tab)
4. **Clear cache:** Hard refresh (Ctrl+Shift+R)

### CSV parsing failed?
1. **Check CSV format:** Must have headers in first row
2. **Check encoding:** Use UTF-8 encoding
3. **Check delimiters:** Use commas (not semicolons or tabs)

### Schema detection showing "other"?
1. **Check column names:** Must match platform patterns (see platformConfigs)
2. **Check sample data:** Need at least 10 rows for accurate detection
3. **Check platform:** Only TikTok, YouTube, Instagram, LinkedIn, Shopify auto-detect

---

## 🎬 Video Demo Script

**Record a 2-minute demo:**

1. **Intro** (0:00-0:10)
   - "Let me show you Setique Social's new AI-powered upload flow"

2. **Upload CSV** (0:10-0:20)
   - Click Upload Dataset, fill form, select CSV
   - "Watch what happens when I upload a TikTok CSV..."

3. **Auto-Detection** (0:20-0:40)
   - Show loading spinner
   - Platform detected (TikTok 🎵 92% confidence)
   - "It automatically detected this is TikTok data"

4. **Schema Analysis** (0:40-1:00)
   - Point to canonical fields mapping
   - "7 core fields normalized to USS v1.0"
   - "Plus 6 TikTok-specific extended fields"

5. **Version Selection** (1:00-1:20)
   - "Now I can choose to sell standard, extended, or both versions"
   - Click "Both Versions" (recommended)
   - "Extended fields unlock 2x higher pricing"

6. **Hygiene Scan** (1:20-1:40)
   - "Automatic PII scan ensures data is clean"
   - "No emails, phone numbers, or sensitive info"

7. **AI Pricing** (1:40-2:00)
   - "AI suggests $85 based on 5 factors"
   - Show factor breakdown
   - Click "Accept $85.00"
   - "Price auto-filled! Ready to publish"

8. **Outro** (2:00-2:10)
   - "All 18 metadata fields saved to database"
   - "Week 2 complete! 🎉"

---

## 📊 Performance Metrics

Expected analysis times:
- **CSV Parsing:** ~200ms (1,000 rows)
- **Schema Detection:** ~50ms
- **Hygiene Scanning:** ~100ms (1,000 rows)
- **Pricing Calculation:** ~10ms
- **Total:** ~360ms ⚡

---

## 🚀 Next Steps

After testing Week 2:
- **Week 3:** Marketplace filters (platform, extended fields, hygiene, price range)
- **Week 4:** Dataset detail pages (full schema display, hygiene breakdown)
- **Week 5:** Buyer search & discovery

---

**Need Help?**
- Check `WEEK_2_COMPLETION_SUMMARY.md` for full technical details
- Check browser console for errors
- Verify Netlify deployment is live
- Test with different CSV formats

**Sample CSVs Available:**
- `tests/fixtures/tiktok-sample.csv` - TikTok with extended fields ✅
- `tests/fixtures/test-dataset.csv` - Generic dataset (no social fields)

Happy testing! 🎉
