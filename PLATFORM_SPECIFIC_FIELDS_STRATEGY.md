# 🎯 Platform-Specific Fields & Buyer Flexibility Strategy

**Date**: October 17, 2025  
**Status**: Critical Architecture Decision  
**Problem**: Buyers want standardized data BUT also platform-unique metrics  

---

## 📋 The Core Tension

**Scenario 1**: ML Researcher  
*"I want ALL social video platforms (TikTok, YouTube, Reels) with standardized fields for cross-platform model training."*  
→ Needs: Universal schema, platform-agnostic

**Scenario 2**: YouTube Strategy Consultant  
*"I specifically want YouTube datasets with watch time, retention curves, and traffic sources."*  
→ Needs: YouTube-specific fields, platform filtering

**The Solution**: **Hybrid Schema Architecture**
- **Core fields** (universal, always present)
- **Platform-specific fields** (optional, preserved when available)
- **Smart filtering** (buyers choose what they want)

---

## 🏗️ Hybrid Schema Architecture

### **Structure: Core + Extended Fields**

Every dataset has TWO field groups:

#### **1. Core Fields (Universal Schema)** ✅ ALWAYS PRESENT
```csv
date,views,likes,comments,shares,platform,data_type
2024-01-15,1250,85,12,8,youtube,social_video
```

#### **2. Extended Fields (Platform-Specific)** ✅ PRESERVED WHEN AVAILABLE
```csv
date,views,likes,comments,shares,platform,youtube_watch_time_minutes,youtube_avg_view_duration,youtube_retention_rate,youtube_traffic_source_browse,youtube_traffic_source_suggested
2024-01-15,1250,85,12,8,youtube,5400,4.32,0.68,320,580
```

**Key Principle**: Core fields are normalized, extended fields keep original platform names (prefixed).

---

## 📊 Platform-Specific Field Taxonomy

### **YouTube Extended Fields** (Prefix: `youtube_`)

| Field | Type | Description | Why Unique to YouTube |
|-------|------|-------------|----------------------|
| `youtube_watch_time_minutes` | INTEGER | Total watch time | Core metric for monetization |
| `youtube_avg_view_duration` | FLOAT | Avg seconds per view | Algorithm ranking factor |
| `youtube_retention_rate` | FLOAT | % watched (0-100) | Unique retention tracking |
| `youtube_impressions_ctr` | FLOAT | Click-through rate % | Thumbnail performance |
| `youtube_traffic_source_browse` | INTEGER | Views from browse features | YouTube-specific discovery |
| `youtube_traffic_source_suggested` | INTEGER | Views from suggested videos | Algorithm recommendation |
| `youtube_traffic_source_search` | INTEGER | Views from search | SEO performance |
| `youtube_traffic_source_external` | INTEGER | Views from external sites | Off-platform promotion |
| `youtube_subscribers_gained` | INTEGER | New subs from video | Growth attribution |
| `youtube_cards_clicks` | INTEGER | End screen clicks | YouTube Cards feature |
| `youtube_endscreen_clicks` | INTEGER | End screen element clicks | YouTube-specific CTA |
| `youtube_revenue_estimated` | DECIMAL | Estimated ad revenue (USD) | Monetization data |
| `youtube_cpm` | DECIMAL | Cost per mille | Ad rate metric |

**Use Cases**:
- Content strategy (which traffic sources work)
- Monetization analysis (CPM trends)
- Algorithm optimization (retention vs reach)
- Thumbnail testing (CTR analysis)

---

### **Spotify Extended Fields** (Prefix: `spotify_`)

| Field | Type | Description | Why Unique to Spotify |
|-------|------|-------------|----------------------|
| `spotify_streams` | INTEGER | Total streams | Core audio metric |
| `spotify_listeners` | INTEGER | Unique listeners | Reach measurement |
| `spotify_skip_rate` | FLOAT | % skipped before 30s | Engagement quality |
| `spotify_playlist_adds` | INTEGER | Added to playlists | Curation signal |
| `spotify_playlist_reach` | INTEGER | Reach via playlists | Discovery channel |
| `spotify_saves` | INTEGER | Library saves | Strong engagement signal |
| `spotify_follower_conversion` | FLOAT | % listeners who followed | Artist growth |
| `spotify_stream_source_search` | INTEGER | Streams from search | Discovery method |
| `spotify_stream_source_playlist` | INTEGER | Streams from playlists | Algorithmic placement |
| `spotify_stream_source_artist_page` | INTEGER | Streams from artist profile | Direct engagement |
| `spotify_stream_source_radio` | INTEGER | Streams from radio feature | Algorithm-driven |
| `spotify_listener_age_18_24` | FLOAT | % listeners aged 18-24 | Audio-specific demo |
| `spotify_listener_gender_split` | FLOAT | M/F ratio | Audience composition |
| `spotify_track_completion_rate` | FLOAT | % listened to end | Engagement depth |

**Use Cases**:
- Playlist strategy (which playlists drive streams)
- Skip rate analysis (song quality indicator)
- Demographic targeting (age/gender patterns)
- Discovery optimization (search vs algorithm)

---

### **TikTok Extended Fields** (Prefix: `tiktok_`)

| Field | Type | Description | Why Unique to TikTok |
|-------|------|-------------|----------------------|
| `tiktok_video_views` | INTEGER | Video plays | Short-form specific |
| `tiktok_for_you_impressions` | INTEGER | FYP impressions | Algorithm reach |
| `tiktok_following_impressions` | INTEGER | Following feed impressions | Follower engagement |
| `tiktok_profile_views` | INTEGER | Profile visits | Discovery metric |
| `tiktok_sound_usage` | INTEGER | Times audio was used | Virality indicator |
| `tiktok_duets` | INTEGER | Duet creations | TikTok-specific interaction |
| `tiktok_stitches` | INTEGER | Stitch creations | Content remixing |
| `tiktok_avg_watch_time` | FLOAT | Avg seconds watched | Short-form retention |
| `tiktok_full_video_watched` | INTEGER | Complete views | Completion metric |
| `tiktok_traffic_source_fyp` | FLOAT | % from For You Page | Algorithm performance |
| `tiktok_traffic_source_hashtag` | INTEGER | Views from hashtags | Discoverability |
| `tiktok_audience_territory_top1` | TEXT | Top country | Geographic reach |

**Use Cases**:
- FYP optimization (algorithm understanding)
- Virality tracking (sound usage, duets, stitches)
- Completion rate analysis (retention for short-form)
- Hashtag strategy

---

### **LinkedIn Extended Fields** (Prefix: `linkedin_`)

| Field | Type | Description | Why Unique to LinkedIn |
|-------|------|-------------|----------------------|
| `linkedin_impressions` | INTEGER | Post impressions | Professional reach |
| `linkedin_unique_impressions` | INTEGER | Unique views | Deduplicated reach |
| `linkedin_engagement_rate` | FLOAT | Engagement % | Professional benchmark |
| `linkedin_click_through_rate` | FLOAT | Link CTR % | B2B conversion metric |
| `linkedin_reaction_types` | JSON | Breakdown by reaction | Professional sentiment |
| `linkedin_shares_breakdown` | JSON | Shares by method | Distribution channel |
| `linkedin_follower_demographics` | JSON | Industry, seniority, function | Professional targeting |
| `linkedin_company_page_views` | INTEGER | Company page visits | B2B brand metric |
| `linkedin_job_title_breakdown` | JSON | Viewer job titles | Audience quality |
| `linkedin_industry_breakdown` | JSON | Viewer industries | Market segmentation |
| `linkedin_seniority_breakdown` | JSON | Viewer seniority levels | Decision-maker reach |
| `linkedin_company_size_breakdown` | JSON | Viewer company sizes | Market segment |

**Use Cases**:
- B2B targeting (seniority, industry, function)
- Professional benchmarking (industry standards)
- Lead quality analysis (decision-maker reach)
- Content relevance (job title engagement)

---

### **Shopify Extended Fields** (Prefix: `shopify_`)

| Field | Type | Description | Why Unique to Shopify |
|-------|------|-------------|----------------------|
| `shopify_orders` | INTEGER | Total orders | Core commerce |
| `shopify_gross_sales` | DECIMAL | Gross revenue (USD) | Before discounts/returns |
| `shopify_discounts` | DECIMAL | Discount value (USD) | Promotion impact |
| `shopify_returns` | DECIMAL | Return value (USD) | Product quality signal |
| `shopify_net_sales` | DECIMAL | Net revenue (USD) | Actual revenue |
| `shopify_shipping_revenue` | DECIMAL | Shipping fees (USD) | Logistics revenue |
| `shopify_taxes` | DECIMAL | Tax collected (USD) | Compliance data |
| `shopify_total_sessions` | INTEGER | Site sessions | Traffic volume |
| `shopify_online_store_sessions` | INTEGER | Direct sessions | Store traffic |
| `shopify_social_sessions` | INTEGER | Social media traffic | Marketing channel |
| `shopify_conversion_rate` | FLOAT | Session → order % | Purchase optimization |
| `shopify_average_order_value` | DECIMAL | AOV (USD) | Basket size |
| `shopify_cart_abandonment_rate` | FLOAT | % carts abandoned | Checkout friction |
| `shopify_returning_customer_rate` | FLOAT | % repeat buyers | Retention metric |
| `shopify_products_sold` | INTEGER | Units sold | Inventory metric |
| `shopify_top_product_categories` | JSON | Category breakdown | Product mix |

**Use Cases**:
- Conversion funnel optimization
- Pricing strategy (AOV, discounts)
- Return rate analysis (product quality)
- Marketing channel ROI (social vs direct)

---

### **Instagram Extended Fields** (Prefix: `instagram_`)

| Field | Type | Description | Why Unique to Instagram |
|-------|------|-------------|----------------------|
| `instagram_reach` | INTEGER | Unique accounts reached | Deduplicated views |
| `instagram_impressions` | INTEGER | Total views | Including repeats |
| `instagram_saves` | INTEGER | Saved posts | Strong intent signal |
| `instagram_story_exits` | INTEGER | Story swipe-aways | Engagement drop |
| `instagram_story_replies` | INTEGER | DM replies to stories | Direct engagement |
| `instagram_profile_activity` | INTEGER | Profile visits | Discovery metric |
| `instagram_website_clicks` | INTEGER | Bio link clicks | Conversion action |
| `instagram_email_clicks` | INTEGER | Email button clicks | Lead generation |
| `instagram_reels_plays` | INTEGER | Reels views | Short-form metric |
| `instagram_reels_reach` | INTEGER | Reels unique reach | Algorithm performance |
| `instagram_carousel_swipes` | INTEGER | Multi-image swipes | Content engagement |
| `instagram_hashtag_impressions` | INTEGER | Views from hashtags | Discoverability |

**Use Cases**:
- Story engagement optimization
- Reels vs feed performance
- Bio link conversion tracking
- Hashtag strategy

---

## 🔍 Buyer Filtering & Discovery

### **Marketplace Filter Options**

```jsx
<FilterPanel>
  {/* Platform Selection */}
  <FilterSection title="Platform">
    <Checkbox label="All Platforms" checked={all} />
    <Divider />
    <Checkbox label="YouTube" checked={youtube} />
    <Checkbox label="Spotify" checked={spotify} />
    <Checkbox label="TikTok" checked={tiktok} />
    <Checkbox label="LinkedIn" checked={linkedin} />
    <Checkbox label="Instagram" checked={instagram} />
    <Checkbox label="Shopify" checked={shopify} />
  </FilterSection>

  {/* Data Type */}
  <FilterSection title="Data Type">
    <Checkbox label="Social Video" checked={socialVideo} />
    <Checkbox label="Social Audio" checked={socialAudio} />
    <Checkbox label="Professional Network" checked={professional} />
    <Checkbox label="E-commerce" checked={commerce} />
  </FilterSection>

  {/* Field Availability (IMPORTANT!) */}
  <FilterSection title="Extended Fields Available">
    <Checkbox label="Watch Time Data" checked={watchTime} />
    <Checkbox label="Traffic Sources" checked={trafficSources} />
    <Checkbox label="Revenue/Monetization" checked={revenue} />
    <Checkbox label="Demographics" checked={demographics} />
    <Checkbox label="Retention Metrics" checked={retention} />
  </FilterSection>

  {/* Quality Indicators */}
  <FilterSection title="Quality">
    <Checkbox label="PII-Free Verified ✅" checked={piiVerified} />
    <Checkbox label="Pro Curator Verified ✅" checked={curatorVerified} />
    <Checkbox label="Extended Fields Included 📊" checked={extendedFields} />
  </FilterSection>
</FilterPanel>
```

---

## 📦 Dataset Packaging: Two Versions

### **Option 1: Standard Version** (Core fields only)
**File**: `dataset_standard.csv`
```csv
date,views,likes,comments,shares,platform,data_type
2024-01-15,1250,85,12,8,youtube,social_video
2024-01-16,980,62,9,5,youtube,social_video
```

**Price**: $50  
**Use Case**: Cross-platform ML training, general analysis  
**Buyer**: Researcher comparing TikTok vs YouTube vs Instagram

---

### **Option 2: Extended Version** (Core + Platform-specific)
**File**: `dataset_extended.csv`
```csv
date,views,likes,comments,shares,platform,data_type,youtube_watch_time_minutes,youtube_avg_view_duration,youtube_retention_rate,youtube_traffic_source_browse,youtube_traffic_source_suggested,youtube_traffic_source_search,youtube_subscribers_gained,youtube_revenue_estimated
2024-01-15,1250,85,12,8,youtube,social_video,5400,4.32,0.68,320,580,150,12,45.50
2024-01-16,980,62,9,5,youtube,social_video,4200,4.28,0.65,280,520,100,8,38.20
```

**Price**: $100 (+100% for extended data)  
**Use Case**: YouTube-specific strategy, monetization analysis  
**Buyer**: YouTube consultant, MCN, creator tool

---

### **Option 3: Bundle (Multi-Creator, Standard)**
**Files**: 100 creator datasets (standard version)
```
creator_001_standard.csv
creator_002_standard.csv
...
creator_100_standard.csv
```

**Price**: $2,500 (50% discount vs individual)  
**Use Case**: Training large ML models, market research  
**Buyer**: AI company, research institution

---

### **Option 4: Bundle (Multi-Creator, Extended)**
**Files**: 100 creator datasets (extended version)
```
creator_001_extended.csv
creator_002_extended.csv
...
creator_100_extended.csv
```

**Price**: $5,000 (50% discount vs individual)  
**Use Case**: Platform-specific analytics at scale  
**Buyer**: YouTube/Spotify, consultancy, market research firm

---

## 🎯 Dataset Detail Page UI

### **Field Availability Badge**

```jsx
<DatasetCard>
  <PlatformBadge platform="youtube" />
  
  {/* Core Schema Badge */}
  <Badge variant="success">
    ✅ Universal Schema (Core Fields)
  </Badge>
  
  {/* Extended Fields Badge */}
  {dataset.has_extended_fields && (
    <Badge variant="purple">
      📊 Extended: {dataset.extended_field_count} YouTube-specific fields
    </Badge>
  )}
  
  {/* What's Included Dropdown */}
  <Collapsible title="📋 Fields Included">
    <FieldList>
      <FieldCategory name="Core Fields (Universal)">
        <Field name="date" type="DATE" />
        <Field name="views" type="INTEGER" />
        <Field name="likes" type="INTEGER" />
        <Field name="comments" type="INTEGER" />
        <Field name="shares" type="INTEGER" />
        <Field name="platform" type="TEXT" />
        <Field name="data_type" type="TEXT" />
      </FieldCategory>
      
      <FieldCategory name="YouTube Extended Fields">
        <Field name="youtube_watch_time_minutes" type="INTEGER" />
        <Field name="youtube_avg_view_duration" type="FLOAT" />
        <Field name="youtube_retention_rate" type="FLOAT" />
        <Field name="youtube_traffic_source_browse" type="INTEGER" />
        <Field name="youtube_traffic_source_suggested" type="INTEGER" />
        <Field name="youtube_traffic_source_search" type="INTEGER" />
        <Field name="youtube_subscribers_gained" type="INTEGER" />
        <Field name="youtube_revenue_estimated" type="DECIMAL" />
      </FieldCategory>
    </FieldList>
  </Collapsible>
  
  {/* Version Selection */}
  <PriceSelector>
    <PriceOption 
      name="Standard Version"
      price={50}
      fields="7 core fields"
      selected={version === 'standard'}
    />
    <PriceOption 
      name="Extended Version"
      price={100}
      fields="7 core + 13 YouTube-specific fields"
      selected={version === 'extended'}
      recommended
    />
  </PriceSelector>
</DatasetCard>
```

---

## 📊 Schema Documentation: Dual Format

### **README.md Section: Field Taxonomy**

```markdown
# Dataset Schema Documentation

## Platform: YouTube
## Version: Extended (Core + Platform-Specific)

---

## 🎯 Core Fields (Universal Schema)

These fields are standardized across ALL platforms for cross-platform analysis:

| Field | Type | Description | Universal Mapping |
|-------|------|-------------|-------------------|
| `date` | DATE | Video publish date (YYYY-MM-DD) | All platforms → `date` |
| `views` | INTEGER | Total video views | YouTube "Views" → `views` |
| `likes` | INTEGER | Total likes | YouTube "Likes" → `likes` |
| `comments` | INTEGER | Comment count | YouTube "Comments" → `comments` |
| `shares` | INTEGER | Share count | YouTube "Shares" → `shares` |
| `platform` | TEXT | Always "youtube" | Metadata |
| `data_type` | TEXT | "social_video" | Metadata |

**Use Case**: Compare YouTube vs TikTok vs Instagram engagement using these fields.

---

## 📊 YouTube Extended Fields

These fields are unique to YouTube and provide platform-specific insights:

### Monetization Metrics
| Field | Type | Description |
|-------|------|-------------|
| `youtube_watch_time_minutes` | INTEGER | Total minutes watched |
| `youtube_revenue_estimated` | DECIMAL | Estimated ad revenue (USD) |
| `youtube_cpm` | DECIMAL | Cost per thousand impressions |

### Engagement Depth
| Field | Type | Description |
|-------|------|-------------|
| `youtube_avg_view_duration` | FLOAT | Average seconds per view |
| `youtube_retention_rate` | FLOAT | % of video watched (0-100) |
| `youtube_subscribers_gained` | INTEGER | New subs from this video |

### Traffic Sources (YouTube-Specific Discovery)
| Field | Type | Description |
|-------|------|-------------|
| `youtube_traffic_source_browse` | INTEGER | Views from YouTube homepage |
| `youtube_traffic_source_suggested` | INTEGER | Views from suggested videos |
| `youtube_traffic_source_search` | INTEGER | Views from YouTube search |
| `youtube_traffic_source_external` | INTEGER | Views from external links |

### Interactive Elements
| Field | Type | Description |
|-------|------|-------------|
| `youtube_cards_clicks` | INTEGER | End card clicks |
| `youtube_endscreen_clicks` | INTEGER | End screen element clicks |
| `youtube_impressions_ctr` | FLOAT | Thumbnail click-through rate |

**Use Case**: Optimize YouTube strategy (traffic sources, monetization, retention).

---

## 🔄 Cross-Platform Compatibility

This dataset is compatible with:
- ✅ Other YouTube datasets (merge on `date` + extended fields)
- ✅ TikTok/Instagram datasets (merge on core fields only)
- ✅ Cross-platform ML models (use core fields)
- ✅ YouTube-specific tools (use extended fields)

---

## 💡 Usage Examples

### Compare YouTube vs TikTok (Core Fields Only)
\`\`\`python
youtube_df = pd.read_csv('youtube_dataset.csv')
tiktok_df = pd.read_csv('tiktok_dataset.csv')

# Use universal schema for comparison
core_fields = ['date', 'views', 'likes', 'comments', 'shares']
youtube_core = youtube_df[core_fields]
tiktok_core = tiktok_df[core_fields]

combined = pd.concat([youtube_core, tiktok_core])
\`\`\`

### YouTube-Specific Analysis (Extended Fields)
\`\`\`python
# Analyze monetization by traffic source
youtube_df['revenue_per_view'] = youtube_df['youtube_revenue_estimated'] / youtube_df['views']

sources = ['youtube_traffic_source_browse', 'youtube_traffic_source_suggested', 
           'youtube_traffic_source_search', 'youtube_traffic_source_external']

for source in sources:
    youtube_df[f'{source}_revenue'] = (
        youtube_df[source] / youtube_df['views'] * youtube_df['youtube_revenue_estimated']
    )
\`\`\`

### Retention Analysis
\`\`\`python
# Find correlation between retention and engagement
import matplotlib.pyplot as plt

plt.scatter(youtube_df['youtube_retention_rate'], 
            youtube_df['likes'] / youtube_df['views'])
plt.xlabel('Retention Rate (%)')
plt.ylabel('Like Rate')
plt.title('Retention vs Engagement')
\`\`\`
```

---

## 🎯 Search & Discovery Enhancements

### **Search Query Examples**

```
"YouTube datasets with monetization data"
→ Filter: platform=youtube, has_field=youtube_revenue_estimated

"Spotify datasets with playlist data"
→ Filter: platform=spotify, has_field=spotify_playlist_adds

"Cross-platform social video engagement"
→ Filter: data_type=social_video, version=standard

"TikTok FYP algorithm data"
→ Filter: platform=tiktok, has_field=tiktok_for_you_impressions
```

### **Smart Recommendations**

```jsx
<RecommendationPanel>
  {/* If buyer views YouTube dataset */}
  <RecommendedDatasets>
    <h3>Buyers of this dataset also purchased:</h3>
    <DatasetCard title="YouTube Creator Bundle (50 channels)" />
    <DatasetCard title="YouTube vs TikTok comparison study" />
    <DatasetCard title="YouTube monetization trends 2024" />
  </RecommendedDatasets>
  
  {/* If buyer has cross-platform needs */}
  <CrossPlatformSuggestion>
    <Alert variant="info">
      💡 Looking to compare platforms? Consider the <strong>Standard Version</strong> 
      for cross-platform compatibility.
    </Alert>
  </CrossPlatformSuggestion>
</RecommendationPanel>
```

---

## 📈 Pricing Strategy by Version

### **Individual Dataset Pricing**

| Version | Core Fields | Extended Fields | Price | Use Case |
|---------|-------------|-----------------|-------|----------|
| Standard | ✅ (7 fields) | ❌ | $50 | Cross-platform analysis |
| Extended | ✅ (7 fields) | ✅ (8-15 fields) | $100 | Platform-specific strategy |

### **Bundle Pricing (100 creators)**

| Version | Individual Price | Bundle Price | Discount |
|---------|------------------|--------------|----------|
| Standard | $50 × 100 = $5,000 | $2,500 | 50% |
| Extended | $100 × 100 = $10,000 | $5,000 | 50% |

### **Upgrade Path**

```jsx
<UpgradeOption>
  Already purchased Standard Version?
  <Button>Upgrade to Extended (+$50)</Button>
  
  {/* Don't pay full $100, just the difference */}
</UpgradeOption>
```

---

## 🎯 Creator Upload Experience

### **Upload Modal: Extended Fields Detection**

```jsx
<UploadFlow>
  {/* Step 1: Upload file */}
  <FileUpload onChange={detectPlatform} />
  
  {/* Step 2: Show detected fields */}
  <FieldDetectionSummary>
    <Alert variant="success">
      ✅ Detected platform: <strong>YouTube</strong>
    </Alert>
    
    <FieldBreakdown>
      <FieldCategory>
        <h4>Core Fields (7 detected)</h4>
        <CheckList>
          <CheckItem checked>date</CheckItem>
          <CheckItem checked>views</CheckItem>
          <CheckItem checked>likes</CheckItem>
          <CheckItem checked>comments</CheckItem>
          <CheckItem checked>shares</CheckItem>
        </CheckList>
      </FieldCategory>
      
      <FieldCategory>
        <h4>YouTube Extended Fields (13 detected) 🎉</h4>
        <CheckList>
          <CheckItem checked>Watch time</CheckItem>
          <CheckItem checked>Avg view duration</CheckItem>
          <CheckItem checked>Retention rate</CheckItem>
          <CheckItem checked>Traffic sources (4 types)</CheckItem>
          <CheckItem checked>Subscribers gained</CheckItem>
          <CheckItem checked>Revenue estimated</CheckItem>
          <CheckItem checked>CTR data</CheckItem>
        </CheckList>
        
        <Alert variant="info">
          💰 <strong>Pricing Tip:</strong> Extended fields command 2x price ($100 vs $50)
        </Alert>
      </FieldCategory>
    </FieldBreakdown>
  </FieldDetectionSummary>
  
  {/* Step 3: Version selection */}
  <VersionSelector>
    <RadioOption 
      value="both"
      label="Publish BOTH versions (Recommended)"
      sublabel="Standard ($50) + Extended ($100) = reach more buyers"
    />
    <RadioOption 
      value="extended"
      label="Extended only ($100)"
      sublabel="YouTube specialists only"
    />
    <RadioOption 
      value="standard"
      label="Standard only ($50)"
      sublabel="Cross-platform buyers only (lower price)"
    />
  </VersionSelector>
</UploadFlow>
```

---

## 🔄 Database Schema Changes

### **Add to `datasets` table**:

```sql
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS has_extended_fields BOOLEAN DEFAULT false;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS extended_field_count INTEGER DEFAULT 0;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS extended_fields_list JSONB; -- ["youtube_watch_time", "youtube_retention", ...]
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS dataset_version TEXT DEFAULT 'standard'; -- 'standard', 'extended', 'both'
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS standard_version_id UUID REFERENCES datasets(id); -- Link standard → extended
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS extended_version_id UUID REFERENCES datasets(id); -- Link extended → standard
```

### **Query Examples**:

```sql
-- Find YouTube datasets with monetization data
SELECT * FROM datasets
WHERE platform = 'youtube'
  AND extended_fields_list ? 'youtube_revenue_estimated'
  AND has_extended_fields = true;

-- Find cross-platform compatible datasets
SELECT * FROM datasets
WHERE dataset_version IN ('standard', 'both')
  AND data_type = 'social_video';

-- Count extended field availability by platform
SELECT platform, 
       AVG(extended_field_count) as avg_extended_fields,
       COUNT(*) FILTER (WHERE has_extended_fields) as extended_count,
       COUNT(*) as total_count
FROM datasets
GROUP BY platform;
```

---

## 🎯 Implementation Priority

### **Week 1: Core + Extended Architecture**
1. Define extended field schemas per platform
2. Update transformation pipeline to preserve extended fields
3. Add `platform_` prefix to all extended fields
4. Test with YouTube + Spotify

### **Week 2: Dual Version System**
1. Generate both Standard and Extended versions
2. Link versions in database
3. Update upload flow to detect extended fields
4. Add version selector to dataset detail page

### **Week 3: Buyer Discovery**
1. Add "Extended Fields Available" filter
2. Show field breakdown in dataset cards
3. Add upgrade path (Standard → Extended)
4. Implement smart recommendations

### **Week 4: Documentation**
1. Auto-generate field documentation
2. Add platform-specific usage examples
3. Create cross-platform compatibility guide
4. Build field comparison tool

---

## 🎉 Final Recommendation

**Publish BOTH versions by default**:
- Standard Version ($50): Reach cross-platform buyers, ML researchers
- Extended Version ($100): Reach platform specialists, consultants

**Creator gets**:
- 2x listings from 1 upload
- Broader buyer audience
- Higher total revenue potential

**Buyer gets**:
- Choice based on use case
- Standard = quick cross-platform analysis
- Extended = deep platform-specific insights

**Platform gets**:
- Differentiation: "Only marketplace with dual schema approach"
- Higher GMV (more versions sold)
- Better buyer matching (right data for right use case)

---

**This solves the tension**: Standardization for cross-platform + Flexibility for platform-specific analysis! 🎯
