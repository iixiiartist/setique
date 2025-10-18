# URGENT: Run Database Migration Before Testing

## ⚠️ Problem
The `SocialDataUploadModal` is failing with a 400 error because the database doesn't have the social analytics columns yet. The migration `025_social_analytics_fields.sql` needs to be run on your Supabase database.

## ✅ Solution: Run the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your project: `setique`

2. **Navigate to SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration SQL:**
   - Open `sql/migrations/025_social_analytics_fields.sql`
   - Copy lines 10-38 (the ALTER TABLE statement)

4. **Paste and Run:**
   ```sql
   ALTER TABLE datasets
     -- Platform & Data Type
     ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('tiktok', 'youtube', 'instagram', 'linkedin', 'shopify', 'twitter', 'facebook', 'spotify', 'other')),
     ADD COLUMN IF NOT EXISTS data_type TEXT CHECK (data_type IN ('social_analytics', 'ecommerce', 'professional', 'other')) DEFAULT 'other',
     
     -- Extended Fields & Versioning
     ADD COLUMN IF NOT EXISTS has_extended_fields BOOLEAN DEFAULT false,
     ADD COLUMN IF NOT EXISTS extended_field_count INTEGER DEFAULT 0,
     ADD COLUMN IF NOT EXISTS extended_fields_list JSONB DEFAULT '[]'::jsonb,
     ADD COLUMN IF NOT EXISTS dataset_version TEXT CHECK (dataset_version IN ('standard', 'extended', 'both')) DEFAULT 'standard',
     ADD COLUMN IF NOT EXISTS standard_version_id UUID REFERENCES datasets(id),
     ADD COLUMN IF NOT EXISTS extended_version_id UUID REFERENCES datasets(id),
     
     -- Schema Detection & Analysis
     ADD COLUMN IF NOT EXISTS schema_detected BOOLEAN DEFAULT false,
     ADD COLUMN IF NOT EXISTS schema_confidence DECIMAL(3,2) CHECK (schema_confidence >= 0 AND schema_confidence <= 1),
     ADD COLUMN IF NOT EXISTS canonical_fields JSONB DEFAULT '{}'::jsonb,
     
     -- PII Hygiene Pipeline
     ADD COLUMN IF NOT EXISTS hygiene_version TEXT DEFAULT 'v1.0',
     ADD COLUMN IF NOT EXISTS hygiene_passed BOOLEAN DEFAULT false,
     ADD COLUMN IF NOT EXISTS pii_issues_found INTEGER DEFAULT 0,
     ADD COLUMN IF NOT EXISTS hygiene_report JSONB DEFAULT '{}'::jsonb,
     
     -- Dynamic Pricing
     ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10,2),
     ADD COLUMN IF NOT EXISTS price_confidence DECIMAL(3,2) CHECK (price_confidence >= 0 AND price_confidence <= 1),
     ADD COLUMN IF NOT EXISTS pricing_factors JSONB DEFAULT '{}'::jsonb;
   ```

5. **Run Indexes:**
   After the ALTER TABLE succeeds, run the indexes (lines 44-64):
   ```sql
   -- Platform filtering (for marketplace filters)
   CREATE INDEX IF NOT EXISTS idx_datasets_platform 
     ON datasets(platform) 
     WHERE platform IS NOT NULL;

   -- Data type filtering
   CREATE INDEX IF NOT EXISTS idx_datasets_data_type 
     ON datasets(data_type);

   -- Extended fields filtering (for buyers looking for platform-specific data)
   CREATE INDEX IF NOT EXISTS idx_datasets_has_extended 
     ON datasets(has_extended_fields) 
     WHERE has_extended_fields = true;

   -- Hygiene verification filtering (for buyers needing clean data)
   CREATE INDEX IF NOT EXISTS idx_datasets_hygiene_passed 
     ON datasets(hygiene_passed) 
     WHERE hygiene_passed = true;

   -- Composite index for social analytics marketplace queries
   CREATE INDEX IF NOT EXISTS idx_datasets_social_marketplace 
     ON datasets(platform, has_extended_fields, hygiene_passed) 
     WHERE data_type = 'social_analytics';
   ```

6. **Verify:**
   Run this query to confirm columns exist:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'datasets' 
     AND column_name IN ('platform', 'data_type', 'has_extended_fields', 'schema_detected', 'hygiene_passed', 'suggested_price')
   ORDER BY column_name;
   ```

   You should see 6 rows returned with the column names.

### Option 2: Via Supabase CLI (Advanced)

If you have Supabase CLI installed:

```powershell
# Link to your project (if not already linked)
supabase link --project-ref <your-project-ref>

# Run the migration
supabase db push

# Or run specific migration file
supabase db execute --file sql/migrations/025_social_analytics_fields.sql
```

## 🧪 After Migration - Test the Upload

1. **Refresh your browser** (Ctrl + Shift + R)
2. **Navigate to Dashboard**
3. **Click "Upload Social Data"** (purple button)
4. **Upload a CSV file** (can be any CSV with columns)
5. **Fill form and submit**
6. **Should succeed** without 400 error

## 📊 Expected Database State

After migration, your `datasets` table will have **18 new columns**:

### Platform & Type (2 columns)
- `platform` - TEXT (tiktok, youtube, instagram, etc.)
- `data_type` - TEXT (social_analytics, ecommerce, professional, other)

### Extended Fields (6 columns)
- `has_extended_fields` - BOOLEAN
- `extended_field_count` - INTEGER
- `extended_fields_list` - JSONB
- `dataset_version` - TEXT (standard, extended, both)
- `standard_version_id` - UUID
- `extended_version_id` - UUID

### Schema Detection (3 columns)
- `schema_detected` - BOOLEAN
- `schema_confidence` - DECIMAL(3,2)
- `canonical_fields` - JSONB

### PII Hygiene (4 columns)
- `hygiene_version` - TEXT
- `hygiene_passed` - BOOLEAN
- `pii_issues_found` - INTEGER
- `hygiene_report` - JSONB

### Dynamic Pricing (3 columns)
- `suggested_price` - DECIMAL(10,2)
- `price_confidence` - DECIMAL(3,2)
- `pricing_factors` - JSONB

## 🔍 Troubleshooting

### Error: "column already exists"
- Safe to ignore - the migration uses `IF NOT EXISTS`
- Some columns may have been added previously

### Error: "permission denied"
- Make sure you're logged into Supabase Dashboard as the project owner
- Or use an API key with admin privileges

### Error: "table doesn't exist"
- Check you're running against the correct database
- Verify `datasets` table exists: `SELECT * FROM datasets LIMIT 1;`

## 📝 Migration Status Checklist

- [ ] Logged into Supabase Dashboard
- [ ] Opened SQL Editor
- [ ] Ran ALTER TABLE command (18 columns added)
- [ ] Ran CREATE INDEX commands (5 indexes created)
- [ ] Verified columns exist with SELECT query
- [ ] Refreshed browser
- [ ] Tested social upload - SUCCESS ✅

## 🚨 Critical Note

**This migration is REQUIRED for the social upload feature to work.** Without these columns, you'll get a 400 error every time you try to upload social analytics data.

The traditional upload will continue to work because it doesn't populate these columns.

## Next Steps After Migration

1. ✅ Migration complete
2. Test social upload with CSV
3. Verify database has all 18 fields populated
4. Test traditional upload (should still work)
5. Commit confirmation: Update `MIGRATION_DEPLOYMENT_GUIDE.md`
