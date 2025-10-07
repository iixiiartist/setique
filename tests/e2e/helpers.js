/**
 * Shared E2E Test Configuration
 * 
 * Contains test user credentials and helper functions used across E2E tests.
 * This ensures consistency across all test files.
 */

export const TEST_USER = {
  email: 'setique.e2etest@gmail.com',
  password: 'TestPassword123!',
  username: 'e2etestuser',
  // Additional test data for validation tests
  invalidEmail: 'not-an-email',
  weakPassword: '123'
};

/**
 * Helper function to login a user in E2E tests
 * Compatible with Playwright 1.56.0
 */
export async function loginUser(page) {
  // Clear cookies and storage to ensure clean state
  await page.context().clearCookies();
  
  // Navigate to login page
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  
  // Clear storage after page loads
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Wait for the email input to be visible (page is ready)
  await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 5000 });
  
  // Fill in credentials using Playwright 1.56.0 compatible syntax
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  
  // Click sign in button
  await page.click('button[type="submit"]');
  
  // Wait for successful login (redirect to dashboard)
  // The login page might redirect to / first, then to /dashboard
  await page.waitForURL(url => {
    return url.pathname === '/dashboard' || url.pathname === '/';
  }, { timeout: 10000 });
  
  // If we landed on homepage, wait longer for the auth state to propagate and redirect
  if (page.url().includes('localhost:3000/') && !page.url().includes('/dashboard')) {
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  }
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
