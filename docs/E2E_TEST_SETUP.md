# E2E Test Setup Guide

## Test User Configuration

The E2E tests require a test user account in Supabase. We've created an automated setup script to make this process easier.

### Quick Setup

1. **Create Test User** (if not already created):
   ```bash
   npm run test:e2e:setup
   ```

2. **Configure Supabase** (One-time setup):
   - Open Supabase Dashboard
   - Go to: **Authentication** → **Providers** → **Email**
   - Set: **"Enable email confirmations"** = **OFF**
   - This allows test users to sign in immediately without email verification

3. **Run E2E Tests**:
   ```bash
   # Run all E2E tests
   npm run test:e2e
   
   # Run specific test file
   npm run test:e2e -- tests/e2e/auth.spec.js
   
   # Run with UI
   npm run test:e2e:ui
   ```

### Test User Credentials

**Email**: `setique.e2etest@gmail.com`  
**Password**: `TestPassword123!`  
**Username**: `e2etestuser`

These credentials are defined in:
- `scripts/setup-test-user.js` (setup script)
- `tests/e2e/helpers.js` (test helpers)

### Alternative Setup Methods

#### Option 1: Manual User Creation (Supabase Dashboard)

1. Open Supabase Dashboard
2. Go to **Authentication** → **Users**
3. Click **"Add user"** → **"Create new user"**
4. Enter:
   - Email: `setique.e2etest@gmail.com`
   - Password: `TestPassword123!`
   - Auto Confirm User: **YES** (important!)
5. After creation, go to **Database** → **profiles** table
6. Add profile record:
   ```sql
   INSERT INTO profiles (id, username, email)
   VALUES (
     '[USER_ID_FROM_AUTH]',
     'e2etestuser',
     'setique.e2etest@gmail.com'
   );
   ```

#### Option 2: Using Service Role Key

If you have access to the service role key (admin permissions):

1. Add to `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. Update `scripts/setup-test-user.js` to use service role key:
   ```javascript
   const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
   ```

3. Run setup:
   ```bash
   npm run test:e2e:setup
   ```

### Test Infrastructure

**Test Helper Functions** (`tests/e2e/helpers.js`):
- `loginUser(page)` - Logs in the test user
- `signUpUser(page, userOverrides)` - Signs up a new user
- `signOut(page)` - Signs out current user
- `TEST_USER` - Test user credentials

**Usage Example**:
```javascript
import { test, expect } from '@playwright/test';
import { TEST_USER, loginUser } from './helpers.js';

test('my test', async ({ page }) => {
  await loginUser(page);
  // Test user is now logged in at /dashboard
});
```

### Troubleshooting

#### User Already Exists
If you see "User already registered" error, the user already exists. You can:
- Try logging in with the test credentials
- Check if email confirmation is pending
- Delete the user from Supabase Dashboard and recreate

#### Email Confirmation Required
The setup script will show this warning if email confirmation is enabled:
```
⚠️  Email confirmation required!
```

**Solution**: Disable email confirmations in Supabase Dashboard (see Step 2 above)

#### Authentication Timeout
If tests fail with "TimeoutError: page.waitForURL", check:
1. Test user exists and is confirmed
2. Test user password is correct
3. Email confirmations are disabled
4. Dev server is running (`npm run dev`)

#### Database Connection Issues
If tests fail with database errors:
1. Check Supabase credentials in `.env`
2. Verify database connection in Supabase Dashboard
3. Check if RLS policies allow test user operations

### Test Files

**Authentication Tests** (`tests/e2e/auth.spec.js`):
- 42 tests covering signup, login, logout, protected routes
- Uses shared TEST_USER from helpers

**Dataset Upload Tests** (`tests/e2e/dataset-upload.spec.js`):
- 48 tests covering modal, form, file upload, validation
- Requires authenticated user
- Uses test fixture: `tests/fixtures/test-dataset.csv`

### CI/CD Integration

For automated testing in CI/CD:

1. **GitHub Actions** (example):
   ```yaml
   - name: Setup test user
     run: npm run test:e2e:setup
     env:
       VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
       VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
   
   - name: Run E2E tests
     run: npm run test:e2e
   ```

2. **Environment Variables** (required):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Best Practices

1. **Test Isolation**: Each test should be independent
2. **Cleanup**: Tests should not leave state changes (or clean up after)
3. **Timeouts**: Use appropriate timeouts for auth operations
4. **Selectors**: Use stable selectors (not dependent on styling)
5. **Assertions**: Be specific with expectations

### Updating Test Credentials

To change test user credentials:

1. Update `scripts/setup-test-user.js`:
   ```javascript
   const TEST_USER = {
     email: 'new-test-user@example.com',
     password: 'NewPassword123!',
     username: 'newtestuser'
   };
   ```

2. Update `tests/e2e/helpers.js` with same credentials

3. Run setup script:
   ```bash
   npm run test:e2e:setup
   ```

### Common Test Commands

```bash
# Setup test user
npm run test:e2e:setup

# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/e2e/auth.spec.js

# Run tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run tests in debug mode
npm run test:e2e:debug

# Run tests with UI
npm run test:e2e:ui

# Run only tests matching pattern
npm run test:e2e -- -g "should login"

# Run tests in specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

### Current Status

✅ Test user creation script complete  
✅ Shared test helpers created  
✅ Test user created in Supabase: `setique.e2etest@gmail.com`  
⚠️  Requires email confirmation to be disabled OR manual confirmation  
📝 147 E2E tests written (auth + upload)  
🎯 Ready to run once user is confirmed  

### Next Steps

1. Disable email confirmations in Supabase Dashboard
2. Run E2E tests: `npm run test:e2e`
3. Review test results and fix any selector issues
4. Continue with remaining test tasks (purchase flow, validation helpers)
