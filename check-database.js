// Automated Supabase Database Setup Script
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jevrieeonwegqjydmhgm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // This would be needed for admin operations
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldnJpZWVvbndlZ3FqeWRtaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzA2MjgsImV4cCI6MjA3NTIwNjYyOH0.Q1QkV209AxubB_w_a7yMEUN2yRoRZpF74DjHHj1Osx0';

console.log('\n========================================');
console.log('  SETIQUE - Database Setup Check');
console.log('========================================\n');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  const tables = ['profiles', 'datasets', 'purchases', 'bounties', 'bounty_submissions'];
  const results = {
    connected: false,
    tablesExist: [],
    tablesMissing: [],
    totalRows: {}
  };

  try {
    console.log('🔌 Testing connection to Supabase...\n');

    // Test each table
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) throw error;

        results.tablesExist.push(table);
        results.totalRows[table] = count || 0;
        console.log(`✅ Table '${table}' exists (${count || 0} rows)`);
      } catch (err) {
        results.tablesMissing.push(table);
        console.log(`❌ Table '${table}' not found`);
      }
    }

    results.connected = true;

    console.log('\n========================================');
    console.log('Status Summary');
    console.log('========================================\n');

    if (results.tablesMissing.length === 0) {
      console.log('✅ All tables exist! Your database is ready.');
      console.log('\nYou can now:');
      console.log('  1. Run: npm run dev');
      console.log('  2. Open: http://localhost:3000');
      console.log('  3. Sign up and start using the app!\n');
      return true;
    } else {
      console.log(`⚠️  Missing ${results.tablesMissing.length} tables`);
      console.log('\n📋 TO FIX THIS:\n');
      console.log('  1. Go to: https://supabase.com/dashboard/project/jevrieeonwegqjydmhgm');
      console.log('  2. Click "SQL Editor" in the left sidebar');
      console.log('  3. Click "+ New query"');
      console.log('  4. Copy ALL the SQL from this file:');
      console.log('     supabase/migrations/001_initial_schema.sql');
      console.log('  5. Paste it in the SQL editor');
      console.log('  6. Click "Run" (or press Ctrl+Enter)');
      console.log('  7. You should see: "Success. No rows returned"');
      console.log('  8. Run this script again to verify\n');
      return false;
    }

  } catch (error) {
    console.log('❌ Connection failed!\n');
    console.error('Error:', error.message);
    console.log('\n🔧 Check your .env file has the correct:');
    console.log('   VITE_SUPABASE_URL');
    console.log('   VITE_SUPABASE_ANON_KEY\n');
    return false;
  }
}

// Run the check
checkDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
