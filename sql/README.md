# SQL Scripts Organization

This folder contains all SQL scripts used for database management, organized by purpose.

## 📁 Folder Structure

### `diagnostic/`
Scripts for checking database state and troubleshooting:
- `check_database_schema.sql` - Comprehensive database structure check
- `check_foreign_keys.sql` - Verify foreign key relationships
- `check_pro_curators_table.sql` - Verify pro curators table structure
- `check_tables.sql` - List all tables
- `diagnose_admin_issue.sql` - Admin-related diagnostics

### `setup/`
Initial setup and table creation scripts:
- `create_admin_system.sql` - Creates admins table and activity log
- `create_partnerships_only.sql` - Partnership system tables
- `create_pro_curators_table.sql` - Pro curator application table
- `setup_my_admin.sql` - Add specific user as admin
- `setup_storage_policies.sql` - Configure Supabase storage policies

### `fixes/`
Bug fixes and policy corrections:
- `fix_admin_recursion.sql` - ⚠️ **IMPORTANT** - Fixes RLS infinite recursion
- `fix_allowed_mime_types.sql` - Storage MIME type configuration
- `fix_storage_download_policy.sql` - Download policy corrections
- `run_migration_009.sql` - Migration script

### `migrations/`
Historical step-by-step migration scripts:
- `step1a.sql` through `step5e.sql` - Original migration steps
- *Note: These are archived for reference, new migrations should go in `supabase/migrations/`*

### `admin/`
Admin management scripts:
- `make_myself_admin.sql` - Promote user to admin status

## 🔧 How to Use

### Running Scripts in Supabase

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Create a new query
4. Copy the entire contents of the desired script
5. Click **Run**

### Important Notes

⚠️ **Critical Scripts:**
- Always run `fix_admin_recursion.sql` if you encounter infinite recursion errors
- Run `setup_my_admin.sql` after setting up the admin system to give yourself admin access

✅ **Safe to Re-run:**
- Most diagnostic scripts (`diagnostic/` folder)
- These only read data and don't modify anything

⚠️ **Run Once Only:**
- Setup scripts (`setup/` folder)
- Migration scripts (`migrations/` folder)
- Running these multiple times may cause errors

## 📝 Best Practices

1. **Always test in development first** before running in production
2. **Back up your database** before running fix or migration scripts
3. **Read the script comments** to understand what each script does
4. **Use diagnostic scripts** to verify changes after running setup/fix scripts

## 🚀 Quick Start

If you're setting up a new environment:

1. Database should be set up via `supabase/migrations/` (automatic)
2. Run `setup/create_admin_system.sql`
3. Run `admin/make_myself_admin.sql` (update with your user ID)
4. Run `diagnostic/check_database_schema.sql` to verify everything

## 🐛 Troubleshooting

**Getting infinite recursion errors?**
→ Run `fixes/fix_admin_recursion.sql`

**Admin dashboard not loading?**
→ Run `diagnostic/diagnose_admin_issue.sql` and check output

**Can't see your datasets?**
→ Run `diagnostic/check_database_schema.sql` to verify table structure

---

**Last Updated:** October 5, 2025
