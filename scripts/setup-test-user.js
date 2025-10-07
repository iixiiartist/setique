/* eslint-env node */
/* global process */
/**
 * Test User Setup Script
 * 
 * Creates a test user in Supabase for E2E testing.
 * Run this script before running E2E tests.
 * 
 * Usage: node scripts/setup-test-user.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client with anon key (standard user signup)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user credentials
const TEST_USER = {
  email: 'setique.e2etest@gmail.com',
  password: 'TestPassword123!',
  username: 'e2etestuser'
};

async function setupTestUser() {
  console.log('🔧 Setting up test user for E2E tests...\n');

  try {
    // Try to sign in first to check if user exists
    console.log('1️⃣ Checking if test user exists...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (signInData?.user) {
      console.log('✅ Test user already exists and can sign in');
      console.log('👤 User ID:', signInData.user.id);
      console.log('� Email:', signInData.user.email);
      
      // Sign out
      await supabase.auth.signOut();
      
      console.log('\n✨ Test user is ready!\n');
      console.log('📧 Email:', TEST_USER.email);
      console.log('🔑 Password:', TEST_USER.password);
      console.log('👤 Username:', TEST_USER.username);
      console.log('\n💡 You can now run E2E tests with: npm run test:e2e');
      return;
    }

    // If sign in failed with invalid credentials, try to create user
    if (signInError && signInError.message.includes('Invalid login credentials')) {
      console.log('2️⃣ User does not exist, creating new test user...');
      
      // Sign up new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER.email,
        password: TEST_USER.password,
        options: {
          data: {
            username: TEST_USER.username
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      console.log('✅ Test user created:', signUpData.user?.email);
      console.log('👤 User ID:', signUpData.user?.id);

      // Check if email confirmation is required
      if (signUpData.user && !signUpData.session) {
        console.log('\n⚠️  Email confirmation required!');
        console.log('📧 Check the email inbox for:', TEST_USER.email);
        console.log('🔗 Or disable email confirmation in Supabase Dashboard:');
        console.log('   Authentication > Email Auth > Enable email confirmations = OFF');
      }

      // Sign out
      await supabase.auth.signOut();

      console.log('\n✨ Test user setup complete!\n');
      console.log('📧 Email:', TEST_USER.email);
      console.log('🔑 Password:', TEST_USER.password);
      console.log('👤 Username:', TEST_USER.username);
      console.log('\n💡 You can now run E2E tests with: npm run test:e2e');
      return;
    }

    // Other sign-in errors
    if (signInError) {
      throw signInError;
    }

  } catch (error) {
    console.error('\n❌ Error setting up test user:', error.message);
    
    if (error.message.includes('User already registered')) {
      console.log('\n✅ User already exists!');
      console.log('📧 Email:', TEST_USER.email);
      console.log('🔑 Password:', TEST_USER.password);
      console.log('\n💡 Try running the tests now: npm run test:e2e');
    } else if (error.message.includes('Email signups are disabled')) {
      console.error('\n💡 Email signups are disabled in Supabase.');
      console.error('Please enable them in: Authentication > Providers > Email');
    } else {
      console.error('\nFull error:', error);
      console.error('\n💡 You may need to create the test user manually in Supabase Dashboard');
      console.error('   or enable email signups in Authentication settings.');
      process.exit(1);
    }
  }
}

// Run the setup
setupTestUser();
