# Database Schema Reference

**IMPORTANT**: Always check this file before writing queries. The actual database schema takes precedence over migration files that may not have been run yet.

## Current Production Schema (As of October 6, 2025)

### curation_requests (Bounty System)
```sql
-- Main table for dataset curation bounties
id                    UUID PRIMARY KEY
title                 TEXT NOT NULL
description           TEXT
modality              TEXT
budget_min            DECIMAL(10,2)
budget_max            DECIMAL(10,2)
status                TEXT (open, assigned, completed, closed)
requester_id          UUID -> auth.users(id)  ⚠️ NOT creator_id!
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
target_format         TEXT
target_quality        TEXT
sample_data_url       TEXT
```

**Foreign Key Reference in Queries**:
```javascript
// ✅ CORRECT
.select('*, profiles:requester_id(id, username, email)')
.eq('requester_id', user.id)

// ❌ WRONG
.select('*, profiles:creator_id(id, username, email)')
.eq('creator_id', user.id)
```

### curation_proposals
```sql
-- Proposals from Pro Curators for bounties
id                           UUID PRIMARY KEY
request_id                   UUID -> curation_requests(id)
curator_id                   UUID -> pro_curators(id)
status                       TEXT (pending, accepted, rejected)
proposal_text                TEXT
estimated_completion_days    INTEGER
suggested_price              DECIMAL(10,2)
created_at                   TIMESTAMPTZ
updated_at                   TIMESTAMPTZ
```

**Query Pattern**:
```javascript
// Fetch proposals count
.select('*, curation_proposals(id)')
// Then use: curation_proposals?.length

// Fetch full proposals
.select('*, curation_proposals(id, status, proposal_text, ...)')
```

### deletion_requests
```sql
-- User requests to delete their datasets
id              UUID PRIMARY KEY
dataset_id      UUID -> datasets(id)
requester_id    UUID -> auth.users(id)  ⚠️ NOT user_id!
reason          TEXT
status          TEXT (pending, approved, rejected)
requested_at    TIMESTAMPTZ
reviewed_at     TIMESTAMPTZ
reviewed_by     UUID -> auth.users(id)
admin_notes     TEXT
```

**Foreign Key Reference in Queries**:
```javascript
// ✅ CORRECT
.select('*, profiles:requester_id(id, username, email), datasets:dataset_id(...)')

// ❌ WRONG
.select('*, profiles:user_id(...), datasets!dataset_id(...)')
```

### profiles
```sql
-- User profile information
id                UUID PRIMARY KEY -> auth.users(id)
username          TEXT UNIQUE
email             TEXT
bio               TEXT
avatar_url        TEXT
stripe_account_id TEXT
display_name      TEXT
location          TEXT
website           TEXT
twitter_handle    TEXT
github_handle     TEXT
follower_count    INTEGER DEFAULT 0
following_count   INTEGER DEFAULT 0
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### user_follows
```sql
-- User follow/following relationships
id             UUID PRIMARY KEY
follower_id    UUID -> auth.users(id)  -- User who is following
following_id   UUID -> auth.users(id)  -- User being followed
created_at     TIMESTAMPTZ

-- Constraints:
-- - no_self_follow: Users cannot follow themselves
-- - unique_follow: Each follow relationship is unique
```

**Query Pattern**:
```javascript
// Check if user A follows user B
const { data } = await supabase
  .from('user_follows')
  .select('id')
  .eq('follower_id', userA.id)
  .eq('following_id', userB.id)
  .maybeSingle()

const isFollowing = !!data

// Get user's followers
.select('*, profiles:follower_id(id, username, display_name, avatar_url)')
.eq('following_id', userId)

// Get who user is following
.select('*, profiles:following_id(id, username, display_name, avatar_url)')
.eq('follower_id', userId)
```

### pro_curators
```sql
-- Professional curator profiles
id                    UUID PRIMARY KEY -> auth.users(id)
display_name          TEXT NOT NULL
bio                   TEXT
badge_level           TEXT (bronze, silver, gold, platinum)
specialties           TEXT[]
certification_status  TEXT (pending, approved, rejected)
total_projects        INTEGER DEFAULT 0
rating                DECIMAL(3,2)
portfolio_url         TEXT
created_at            TIMESTAMPTZ
```

### admins
```sql
-- Admin users with elevated permissions
id           UUID PRIMARY KEY
user_id      UUID -> auth.users(id) UNIQUE
role         TEXT (super_admin, moderator, support)
permissions  TEXT[]
created_at   TIMESTAMPTZ
created_by   UUID -> auth.users(id)
```

**Admin Check Pattern**:
```javascript
const { data: adminData } = await supabase
  .from('admins')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

const isAdmin = !!adminData;
```

## Common Query Patterns

### Counting Related Records
```javascript
// ❌ WRONG - Supabase doesn't support (count) aggregate
.select('*, related_table(count)')

// ✅ CORRECT - Fetch IDs and count in JavaScript
.select('*, related_table(id)')
// Then: related_table?.length || 0
```

### Foreign Key Syntax
```javascript
// ✅ CORRECT - Use colon (:) for foreign keys
.select('*, profiles:user_id(id, username)')
.select('*, datasets:dataset_id(id, title)')

// ❌ WRONG - Exclamation (!) is for explicit relationship names
.select('*, profiles!user_id(id, username)')
```

### Filtering by User
```javascript
// ✅ CORRECT - Match actual column names
.eq('requester_id', user.id)  // For curation_requests, deletion_requests
.eq('creator_id', user.id)     // For datasets
.eq('curator_id', user.id)     // For curation_proposals
.eq('user_id', user.id)        // For admins

// ❌ WRONG - Assuming column names
.eq('creator_id', user.id)  // When table uses requester_id
```

## Migration Status

### ⚠️ Pending Migrations (NOT run in production)
- `009_fix_curation_requests_schema.sql` - Would rename `requester_id` → `creator_id`
- This migration has NOT been applied to production database
- Code must use `requester_id` until migration is run

### ✅ Applied Migrations
- All migrations up to `008_pro_curator_system.sql`
- `010_curation_workflow_system.sql` - Adds curator_submissions workflow
- `011_deletion_requests_system.sql` - Adds deletion request system

## Before Writing Queries - Checklist

1. ✅ Check this file for actual column names
2. ✅ Verify foreign key column names (requester_id vs creator_id vs user_id)
3. ✅ Use `:` syntax for foreign keys, not `!`
4. ✅ Never use `(count)` - fetch array and use `.length`
5. ✅ Test queries in Supabase SQL Editor if unsure
6. ✅ Check console logs for 400 errors indicating schema mismatches

## Updating This File

**When to update**: 
- After running any migration in production Supabase
- When discovering schema differences between code and database
- When adding new tables or columns

**How to verify current schema**:
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'your_table_name'
ORDER BY ordinal_position;
```
