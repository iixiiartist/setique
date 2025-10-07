/**
 * Shared E2E Test Configuration
 * 
 * Contains test user credentials and helper functions used across E2E tests.
 * This ensures consistency across all test files.
 */

export const TEST_USER = {
  email: 'setique.e2etest@gmail.com',
  password: 'TestPassword123!',
  username: 'e2etestuser'
};

/**
 * Helper function to login a user in E2E tests
 * Compatible with Playwright 1.56.0
 */
export async function loginUser(page) {
  await page.goto('/login');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Fill in credentials using Playwright 1.56.0 compatible syntax
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  
  // Click sign in button
  await page.click('button[type="submit"]');
  
  // Wait for successful login (redirect to dashboard)
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Helper function to sign up a new user (if needed)
 */
export async function signUpUser(page, userOverrides = {}) {
  const user = { ...TEST_USER, ...userOverrides };
  
  await page.goto('/signup');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Fill in credentials
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  
  // Fill username if field exists
  const usernameField = await page.$('input[placeholder*="username" i]');
  if (usernameField) {
    await page.fill('input[placeholder*="username" i]', user.username);
  }
  
  // Click sign up button
  await page.click('button[type="submit"]');
  
  // Wait for successful signup
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Helper function to sign out
 */
export async function signOut(page) {
  // Look for sign out button (may vary by page)
  const signOutButton = await page.$('button:has-text("Sign Out")');
  if (signOutButton) {
    await signOutButton.click();
    await page.waitForURL(/\//, { timeout: 5000 });
  }
}
