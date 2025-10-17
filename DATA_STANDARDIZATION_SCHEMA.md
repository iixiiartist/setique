# 🎯 Data Standardization & Schema Normalization — Setique Social

**Date**: October 17, 2025  
**Status**: Core Architecture Definition  
**Goal**: Ensure all platform data is structurally consistent for buyers regardless of source

---

## 📋 The Core Problem

**Challenge**: YouTube exports have different column names than TikTok, which differ from LinkedIn, etc.  
**Buyer Pain**: "I want to compare engagement across platforms, but every CSV has different headers!"  
**Solution**: **Universal Schema Standard** — All datasets normalized to common format before sale.

---

## 🏗️ Universal Schema Standard (USS v1.0)

### **Core Principle**: Every platform's export → Canonical format

**Input** (Platform-specific):
```csv
Date Posted,Video Views,Like Count,Comment Count
2024-01-01,1000,50,10
```

**Output** (Standardized):
```csv
date,views,likes,comments,platform,data_type
2024-01-01,1000,50,10,tiktok,social_video
```

---

## 📊 Universal Field Taxonomy

### **Category 1: Core Temporal Fields** (Required for ALL datasets)

| Canonical Field | Type | Description | Examples |
|-----------------|------|-------------|----------|
| `date` | DATE (YYYY-MM-DD) | Event/post/transaction date | 2024-01-01 |
| `timestamp` | DATETIME (ISO8601) | Precise time (optional) | 2024-01-01T14:30:00Z |
| `period_start` | DATE | Start of aggregation period | 2024-01-01 |
| `period_end` | DATE | End of aggregation period | 2024-01-31 |

**Normalization Rules**:
- All dates → ISO 8601 format
- Timestamps → UTC timezone
- If only "Month" provided → first day of month
- If "Week" provided → Monday of that week

---

### **Category 2: Engagement Metrics** (Social platforms)

| Canonical Field | Type | Description | Platform Examples |
|-----------------|------|-------------|-------------------|
| `views` | INTEGER | Total views/impressions | TikTok "Video Views", YouTube "Views", LinkedIn "Impressions" |
| `reach` | INTEGER | Unique viewers | Instagram "Reach", LinkedIn "Unique Impressions" |
| `impressions` | INTEGER | Total displays | Twitter "Impressions", LinkedIn "Impressions" |
| `likes` | INTEGER | Like/heart/thumbs up | All platforms (TikTok "Likes", YouTube "Likes") |
| `comments` | INTEGER | Comment count | All platforms |
| `shares` | INTEGER | Shares/retweets/reposts | TikTok "Shares", Twitter "Retweets" |
| `saves` | INTEGER | Bookmarks/saves | Instagram "Saves", TikTok "Favorites" |
| `clicks` | INTEGER | Link clicks | LinkedIn "Clicks", Twitter "Link Clicks" |
| `engagement_rate` | FLOAT | Engagement % | Calculated or platform-provided |
| `watch_time_seconds` | INTEGER | Total watch time | YouTube "Watch Time", TikTok "Total Time Watched" |
| `avg_watch_duration_seconds` | INTEGER | Average view duration | YouTube "Avg View Duration", TikTok "Avg Watch Time" |
| `completion_rate` | FLOAT | View completion % | YouTube "Retention", TikTok "Completion Rate" |

**Normalization Rules**:
- All counts → non-negative integers
- Rates → 0.0 to 100.0 (percentage)
- Watch time → always in seconds (convert from minutes/hours)
- NULL values → 0 (explicit zero, not missing data)

---

### **Category 3: Audience Metrics** (Growth & Demographics)

| Canonical Field | Type | Description | Platform Examples |
|-----------------|------|-------------|-------------------|
| `followers` | INTEGER | Total followers/subscribers | YouTube "Subscribers", TikTok "Followers" |
| `followers_gained` | INTEGER | New followers in period | All platforms |
| `followers_lost` | INTEGER | Unfollows in period | All platforms |
| `audience_age_18_24` | FLOAT | % audience aged 18-24 | Demographics (percent) |
| `audience_age_25_34` | FLOAT | % audience aged 25-34 | Demographics (percent) |
| `audience_age_35_44` | FLOAT | % audience aged 35-44 | Demographics (percent) |
| `audience_age_45_plus` | FLOAT | % audience aged 45+ | Demographics (percent) |
| `audience_gender_male` | FLOAT | % male audience | Demographics (percent) |
| `audience_gender_female` | FLOAT | % female audience | Demographics (percent) |
| `audience_gender_other` | FLOAT | % non-binary/other | Demographics (percent) |
| `audience_country_top1` | TEXT | Top country code | ISO 3166 (US, GB, CA) |
| `audience_country_top1_pct` | FLOAT | % from top country | 0-100 |

**Normalization Rules**:
- Demographics → always percentages (0-100)
- Must sum to 100% within category
- Country codes → ISO 3166-1 alpha-2
- If platform doesn't provide → NULL (explicit unknown)

---

### **Category 4: Commerce Metrics** (Shopify, Etsy, Gumroad)

| Canonical Field | Type | Description | Platform Examples |
|-----------------|------|-------------|-------------------|
| `orders` | INTEGER | Total orders/transactions | Shopify "Orders", Etsy "Sales" |
| `revenue` | DECIMAL(10,2) | Total revenue (USD) | All commerce platforms |
| `revenue_currency` | TEXT | Currency code | USD, EUR, GBP (ISO 4217) |
| `units_sold` | INTEGER | Total items sold | Product quantity |
| `average_order_value` | DECIMAL(10,2) | AOV (USD) | Calculated or provided |
| `conversion_rate` | FLOAT | Purchase conversion % | Sessions → orders |
| `sessions` | INTEGER | Site visits/sessions | Traffic data |
| `cart_abandonment_rate` | FLOAT | % carts not completed | 0-100 |
| `refunds` | INTEGER | Number of refunds | Customer returns |
| `refund_rate` | FLOAT | % orders refunded | 0-100 |

**Normalization Rules**:
- All revenue → USD (convert using exchange rate at date)
- Store original currency in `revenue_currency`
- Rates → 0-100 (percentage)
- If revenue in non-USD → add `revenue_original` field

---

### **Category 5: Content Metadata** (What content performed)

| Canonical Field | Type | Description | Platform Examples |
|-----------------|------|-------------|-------------------|
| `content_id` | TEXT | Anonymized content identifier | `post_001`, `video_042` |
| `content_type` | ENUM | Type of content | video, image, text, audio, carousel |
| `content_category` | TEXT | Category/topic | education, entertainment, comedy |
| `content_length_seconds` | INTEGER | Duration (for video/audio) | 0 for static content |
| `content_published_date` | DATE | Original publish date | May differ from `date` |
| `content_is_paid` | BOOLEAN | Sponsored/promoted content | true/false |
| `content_hashtags` | ARRAY[TEXT] | Associated hashtags (PII-free) | ["#ai", "#tech"] |

**Normalization Rules**:
- `content_id` → sequential or hashed (never original platform ID)
- `content_type` → lowercase enum
- Length → always seconds
- Hashtags → lowercase, no @ mentions

---

### **Category 6: Professional Metrics** (LinkedIn, X/Twitter)

| Canonical Field | Type | Description | Platform Examples |
|-----------------|------|-------------|-------------------|
| `post_impressions` | INTEGER | Post views | LinkedIn "Impressions" |
| `profile_views` | INTEGER | Profile page views | LinkedIn "Profile Views" |
| `search_appearances` | INTEGER | Search result appearances | LinkedIn "Search Appearances" |
| `connection_requests` | INTEGER | Connection/follow requests | LinkedIn specific |
| `message_opens` | INTEGER | InMail opens | LinkedIn messaging |
| `click_through_rate` | FLOAT | CTR % | Link clicks / impressions |
| `industry_benchmark` | FLOAT | vs industry average | -50 to +200 (percentage) |

**Normalization Rules**:
- All counts → integers
- CTR → 0-100 percentage
- Benchmark → -100 to +500 (can exceed 100% if 5x better)

---

### **Category 7: Creator Economy Metrics** (Patreon, Substack, Gumroad)

| Canonical Field | Type | Description | Platform Examples |
|-----------------|------|-------------|-------------------|
| `subscribers` | INTEGER | Total subscribers/patrons | Patreon "Patrons", Substack "Subscribers" |
| `paid_subscribers` | INTEGER | Paying members | Paid tier count |
| `free_subscribers` | INTEGER | Free tier members | Free tier count |
| `monthly_recurring_revenue` | DECIMAL(10,2) | MRR (USD) | Subscription revenue |
| `churn_rate` | FLOAT | % subscribers lost | Monthly churn |
| `lifetime_value` | DECIMAL(10,2) | Avg LTV per subscriber | Total revenue / subscribers |
| `open_rate` | FLOAT | Email open rate % | Substack, ConvertKit |
| `click_rate` | FLOAT | Email click rate % | Newsletter engagement |

**Normalization Rules**:
- All revenue → USD
- Rates → 0-100 percentage
- MRR → monthly normalized (if weekly, multiply by 4.33)

---

### **Category 8: Education Metrics** (Teachable, Udemy)

| Canonical Field | Type | Description | Platform Examples |
|-----------------|------|-------------|-------------------|
| `enrollments` | INTEGER | Total course enrollments | New students |
| `active_students` | INTEGER | Currently active learners | Engaged in last 30 days |
| `completion_rate` | FLOAT | % students completing | 0-100 |
| `average_rating` | FLOAT | Course rating | 0-5 stars |
| `review_count` | INTEGER | Number of reviews | Rating count |
| `course_revenue` | DECIMAL(10,2) | Revenue (USD) | Sales |
| `refund_rate` | FLOAT | % refunded | 0-100 |

**Normalization Rules**:
- Ratings → 0.0 to 5.0 scale
- All rates → 0-100 percentage

---

### **Category 9: Metadata Fields** (Required for ALL datasets)

| Canonical Field | Type | Description | Example |
|-----------------|------|-------------|---------|
| `platform` | ENUM | Source platform | tiktok, youtube, instagram, linkedin, shopify |
| `data_type` | ENUM | Data category | social_video, social_image, commerce, professional |
| `pii_policy_version` | TEXT | Hygiene version | v1.0 |
| `aggregation_level` | ENUM | Data granularity | daily, weekly, monthly, per_post |
| `record_type` | ENUM | Row type | time_series, summary, per_content |

**Normalization Rules**:
- All lowercase, underscore-separated
- Version → semantic versioning (v1.0, v1.1, v2.0)

---

## 🔄 Transformation Pipeline (How It Works)

### **Step 1: Platform Detection**
```javascript
const detectPlatform = (headers) => {
  // Check headers against platform signature
  if (headers.includes('Video Views') && headers.includes('For You Impressions')) {
    return 'tiktok'
  }
  if (headers.includes('Impressions') && headers.includes('Engagements') && headers.includes('Update type')) {
    return 'linkedin'
  }
  // ... check all platforms
  return 'unknown'
}
```

### **Step 2: Header Mapping**
```javascript
// Load platform config
const config = PLATFORMS['tiktok']

// Map original headers → canonical fields
const mapping = {}
for (const [canonicalField, aliases] of Object.entries(config.headerAliases)) {
  const match = headers.find(h => aliases.includes(h.toLowerCase()))
  if (match) {
    mapping[match] = canonicalField
  }
}

// Result: { "Video Views": "views", "Like Count": "likes", "Date Posted": "date" }
```

### **Step 3: Data Type Conversion**
```javascript
const normalizeValue = (value, fieldType) => {
  switch(fieldType.type) {
    case 'integer':
      return parseInt(value.replace(/,/g, '')) || 0
    
    case 'float':
      return parseFloat(value.replace(/[%,]/g, '')) || 0
    
    case 'date':
      return moment(value).format('YYYY-MM-DD')
    
    case 'currency':
      const num = parseFloat(value.replace(/[$,]/g, ''))
      return num.toFixed(2)
    
    case 'boolean':
      return ['true', 'yes', '1', 'paid'].includes(value.toLowerCase())
    
    default:
      return value
  }
}
```

### **Step 4: Add Metadata Columns**
```javascript
const addMetadata = (row, platform, dataType) => ({
  ...row,
  platform: platform,
  data_type: dataType,
  pii_policy_version: 'v1.0',
  aggregation_level: detectAggregation(row),
  processed_at: new Date().toISOString()
})
```

### **Step 5: Validation & Quality Checks**
```javascript
const validateRow = (row, schema) => {
  const errors = []
  
  // Check required fields
  for (const field of schema.required) {
    if (!row[field] || row[field] === null) {
      errors.push(`Missing required field: ${field}`)
    }
  }
  
  // Check data types
  for (const [field, rules] of Object.entries(schema.canonicalFields)) {
    const value = row[field]
    if (rules.type === 'integer' && !Number.isInteger(value)) {
      errors.push(`${field} must be integer, got ${typeof value}`)
    }
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${field} below minimum: ${value} < ${rules.min}`)
    }
  }
  
  return errors
}
```

### **Step 6: Generate Transformed CSV**
```javascript
const transformDataset = async (rawFile, platform) => {
  const rawData = await parseCSV(rawFile)
  const config = PLATFORMS[platform]
  
  const transformedRows = rawData.map(row => {
    // Map headers
    const mappedRow = mapHeaders(row, config.headerAliases)
    
    // Normalize values
    const normalizedRow = normalizeValues(mappedRow, config.canonicalFields)
    
    // Add metadata
    const enrichedRow = addMetadata(normalizedRow, platform, config.category)
    
    // Validate
    const errors = validateRow(enrichedRow, config)
    if (errors.length > 0) {
      console.warn('Row validation errors:', errors)
    }
    
    return enrichedRow
  })
  
  // Generate new CSV with canonical headers
  const transformedCSV = await generateCSV(transformedRows)
  
  return {
    file: transformedCSV,
    originalRowCount: rawData.length,
    transformedRowCount: transformedRows.length,
    mapping: config.headerAliases,
    errors: []
  }
}
```

---

## 📦 Output Format Examples

### **Before Transformation** (TikTok Raw Export)
```csv
Date Posted,Video Views,Like Count,Comment Count,Share Count,For You Impressions
01/15/2024,1250,85,12,8,3500
01/16/2024,980,62,9,5,2800
```

### **After Transformation** (Universal Schema)
```csv
date,views,likes,comments,shares,impressions,platform,data_type,pii_policy_version,aggregation_level
2024-01-15,1250,85,12,8,3500,tiktok,social_video,v1.0,daily
2024-01-16,980,62,9,5,2800,tiktok,social_video,v1.0,daily
```

---

### **Before Transformation** (Shopify Raw Export)
```csv
Day,Total Sales,Orders,Average Order Value,Sessions,Conversion rate
2024-01-15,"$2,450.00",18,"$136.11",523,3.44%
2024-01-16,"$1,890.50",14,"$135.04",489,2.86%
```

### **After Transformation** (Universal Schema)
```csv
date,revenue,revenue_currency,orders,average_order_value,sessions,conversion_rate,platform,data_type,pii_policy_version
2024-01-15,2450.00,USD,18,136.11,523,3.44,shopify,commerce,v1.0
2024-01-16,1890.50,USD,14,135.04,489,2.86,shopify,commerce,v1.0
```

---

## 🎯 Buyer Benefits: Why This Matters

### **1. Cross-Platform Analysis** ✅
**Without Normalization**:
```sql
-- IMPOSSIBLE: Different column names per platform
SELECT AVG("Video Views") FROM tiktok_data  -- Error: column doesn't exist in other tables
```

**With Normalization**:
```sql
-- WORKS: Same schema across all platforms
SELECT platform, AVG(views) as avg_views
FROM all_social_datasets
GROUP BY platform
ORDER BY avg_views DESC
```

**Buyer Value**: "Compare TikTok vs YouTube engagement with one query"

---

### **2. Time Series Aggregation** ✅
**Without Normalization**:
- YouTube: "Date" in MM/DD/YYYY
- TikTok: "Posted Date" in DD/MM/YYYY
- LinkedIn: "Day" in YYYY-MM-DD
- **Result**: Date parsing errors, wrong chronological order

**With Normalization**:
```python
# Clean time series analysis
df['date'] = pd.to_datetime(df['date'])  # All YYYY-MM-DD format
df.groupby('date')['views'].sum().plot()
```

**Buyer Value**: "Instant time series analysis, no data cleaning needed"

---

### **3. ML Model Training** ✅
**Without Normalization**:
```python
# Feature engineering nightmare
features = {
  'tiktok': ['Video Views', 'Like Count'],
  'youtube': ['Views', 'Likes'],
  'instagram': ['Reach', 'Like Count']
}
# Different shapes, incompatible
```

**With Normalization**:
```python
# Unified feature set
X = df[['views', 'likes', 'comments', 'shares']]
y = df['engagement_rate']
model.fit(X, y)  # Works across all platforms
```

**Buyer Value**: "Train one model on all platforms, no custom preprocessing"

---

### **4. Benchmarking** ✅
**Without Normalization**:
- TikTok "Engagement Rate" = (likes + comments) / views
- Instagram "Engagement" = (likes + comments + saves) / followers
- LinkedIn "Engagement Rate" = engagements / impressions
- **Result**: Incomparable metrics

**With Normalization**:
```python
# Standardized engagement calculation
df['engagement_rate'] = (df['likes'] + df['comments'] + df['shares']) / df['views'] * 100
# Now comparable across all platforms
```

**Buyer Value**: "Apples-to-apples comparison for benchmarking"

---

### **5. Dataset Bundling** ✅
**Without Normalization**:
```csv
# Merging 100 creator datasets
tiktok_dataset_1.csv  -- 15 columns
tiktok_dataset_2.csv  -- 18 columns (different structure)
instagram_dataset.csv -- 12 columns (incompatible)
# Merge fails: column mismatch
```

**With Normalization**:
```python
# Stack datasets effortlessly
all_datasets = pd.concat([
  pd.read_csv('tiktok_1.csv'),
  pd.read_csv('tiktok_2.csv'),
  pd.read_csv('instagram_1.csv')
])
# Perfect union: all have same columns
```

**Buyer Value**: "Buy 100 creator datasets, analyze as one cohesive dataset"

---

## 📊 Schema Documentation for Buyers

### **Included with Every Dataset Purchase**:

**File 1: `README.md`**
```markdown
# Dataset Schema Documentation

## Platform: TikTok
## Data Type: Social Video Analytics
## Date Range: 2024-01-01 to 2024-03-31
## Rows: 90 (daily aggregation)

## Fields

### Core Metrics
- `date` (DATE): Daily post date in YYYY-MM-DD format
- `views` (INTEGER): Total video views
- `likes` (INTEGER): Total likes received
- `comments` (INTEGER): Total comments
- `shares` (INTEGER): Number of shares

### Metadata
- `platform` (TEXT): Always "tiktok"
- `data_type` (TEXT): "social_video"
- `pii_policy_version` (TEXT): "v1.0" (PII-free certified)

## Quality Guarantees
✅ All dates in ISO 8601 format
✅ No missing values (0 = explicit zero, not null)
✅ All metrics validated as non-negative integers
✅ PII removed (no usernames, emails, IDs)

## Usage Examples

### Python
\`\`\`python
import pandas as pd
df = pd.read_csv('dataset.csv')
df['date'] = pd.to_datetime(df['date'])
avg_engagement = (df['likes'] + df['comments']) / df['views']
\`\`\`

### R
\`\`\`r
df <- read.csv('dataset.csv')
df$date <- as.Date(df$date)
summary(df$views)
\`\`\`

### SQL
\`\`\`sql
SELECT date, views, likes,
       (likes::float / views * 100) as like_rate
FROM dataset
ORDER BY date
\`\`\`
```

**File 2: `SCHEMA.json`** (Machine-readable)
```json
{
  "platform": "tiktok",
  "data_type": "social_video",
  "pii_policy_version": "v1.0",
  "row_count": 90,
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-03-31"
  },
  "fields": {
    "date": { "type": "date", "format": "YYYY-MM-DD", "nullable": false },
    "views": { "type": "integer", "min": 0, "nullable": false },
    "likes": { "type": "integer", "min": 0, "nullable": false },
    "comments": { "type": "integer", "min": 0, "nullable": false },
    "shares": { "type": "integer", "min": 0, "nullable": false },
    "platform": { "type": "string", "enum": ["tiktok"] },
    "data_type": { "type": "string", "enum": ["social_video"] }
  },
  "quality_checks": {
    "no_missing_dates": true,
    "no_negative_values": true,
    "chronological_order": true,
    "pii_removed": true
  }
}
```

---

## 🚨 Quality Control Checklist

### **Before Dataset is Published**:

```javascript
const qualityChecks = [
  {
    name: 'Schema Compliance',
    check: (data) => {
      const requiredFields = ['date', 'platform', 'data_type', 'pii_policy_version']
      return requiredFields.every(f => data[0].hasOwnProperty(f))
    }
  },
  {
    name: 'Date Format',
    check: (data) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      return data.every(row => dateRegex.test(row.date))
    }
  },
  {
    name: 'Non-Negative Metrics',
    check: (data) => {
      const metricFields = ['views', 'likes', 'comments', 'shares', 'revenue']
      return data.every(row => 
        metricFields.every(f => !row[f] || row[f] >= 0)
      )
    }
  },
  {
    name: 'No NULL Values',
    check: (data) => {
      return data.every(row =>
        Object.values(row).every(v => v !== null && v !== undefined && v !== '')
      )
    }
  },
  {
    name: 'Chronological Order',
    check: (data) => {
      const dates = data.map(r => new Date(r.date))
      return dates.every((d, i) => i === 0 || d >= dates[i-1])
    }
  }
]

const validateDataset = (data) => {
  const results = qualityChecks.map(check => ({
    name: check.name,
    passed: check.check(data)
  }))
  
  const allPassed = results.every(r => r.passed)
  
  return {
    valid: allPassed,
    checks: results,
    errors: results.filter(r => !r.passed).map(r => r.name)
  }
}
```

---

## 🎯 Implementation Roadmap

### **Week 1: Core Normalization Engine**
1. Build `SchemaTransformer` service (200 LOC)
2. Implement header mapping logic
3. Add data type conversion
4. Test with TikTok, YouTube, Instagram

### **Week 2: Quality Validation**
1. Build validation pipeline
2. Add quality check suite
3. Generate schema documentation
4. Test with real exports

### **Week 3: UI Integration**
1. Show "before/after" preview in upload modal
2. Display schema mapping used
3. Add quality report to dataset detail page
4. Buyer-facing schema docs

### **Week 4: Buyer Tools**
1. Schema comparison tool (compare datasets)
2. Bundle compatibility checker
3. Sample query generator
4. API for programmatic access

---

## 🎉 Success Criteria

**For Creators**:
✅ Upload once, data auto-normalized  
✅ See transformation preview before publishing  
✅ Higher sales (buyers trust consistent data)

**For Buyers**:
✅ All datasets have same structure  
✅ Can compare/aggregate without preprocessing  
✅ ML-ready data (no cleaning needed)  
✅ Schema documentation included

**For Platform**:
✅ Differentiation: "Only marketplace with standardized data"  
✅ Reduced support tickets (no "columns don't match" complaints)  
✅ Higher conversion (buyers see quality)  
✅ Bundling revenue (compatible datasets)

---

## 📝 Final Recommendation

**Build the normalization pipeline FIRST** (before Phase 1 MVP launch):
1. Core transformer: Week 1
2. Quality checks: Week 2
3. Documentation generator: Week 3
4. Buyer tools: Week 4

**Why**:
- Foundation for all future platform additions
- Core competitive advantage
- Prevents tech debt (hard to retrofit later)
- Enables high-value bundling

**The normalization layer is what transforms Setique from "file hosting" to "data marketplace."**

---

Ready to start building the SchemaTransformer service? This is the secret sauce that makes cross-platform data actually usable! 🚀
