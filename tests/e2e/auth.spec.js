import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * 
 * Tests cover:
 * - Sign up with valid credentials
 * - Sign up validation (email, password requirements)
 * - Login with correct credentials
 * - Login with incorrect credentials
 * - Logout and session clearing
 * - Session persistence across page refresh
 * - Protected route access control
 */

const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  weakPassword: '123',
  invalidEmail: 'not-an-email'
};

test.describe('Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start at home page
    await page.goto('/');
  });

  test.describe('Sign Up', () => {
    
    test('should display sign up form when clicking Get Started', async ({ page }) => {
      // Click Get Started button
      await page.getByRole('link', { name: /get started/i }).first().click();
      
      // Should navigate to sign up page
      await expect(page).toHaveURL(/\/signup/);
      
      // Form elements should be visible
      await expect(page.getByPlaceholderText(/email/i)).toBeVisible();
      await expect(page.getByPlaceholderText(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/signup');
      
      // Enter invalid email
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.invalidEmail);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      
      // Try to submit
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should show validation error
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test('should show validation error for weak password', async ({ page }) => {
      await page.goto('/signup');
      
      // Enter weak password
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.weakPassword);
      
      // Try to submit
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should show password requirements error
      await expect(page.locator('text=/password.*6.*characters/i')).toBeVisible();
    });

    test('should successfully sign up with valid credentials', async ({ page }) => {
      await page.goto('/signup');
      
      // Fill in valid credentials
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      
      // Submit form
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should redirect to dashboard after successful signup
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // Dashboard elements should be visible
      await expect(page.getByText(/welcome/i)).toBeVisible();
    });

    test('should show error when signing up with existing email', async ({ page }) => {
      await page.goto('/signup');
      
      // Use an email that already exists (from previous test)
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should show error message
      await expect(page.getByText(/already.*registered|already.*exists/i)).toBeVisible();
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/signup');
      
      // Should have link to login
      const loginLink = page.getByRole('link', { name: /already have.*account|sign in/i });
      await expect(loginLink).toBeVisible();
      
      // Clicking should navigate to login
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Login', () => {
    
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      
      // Form elements should be visible
      await expect(page.getByPlaceholderText(/email/i)).toBeVisible();
      await expect(page.getByPlaceholderText(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
    });

    test('should show error with incorrect password', async ({ page }) => {
      await page.goto('/login');
      
      // Enter valid email but wrong password
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill('WrongPassword123!');
      
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      // Should show error message
      await expect(page.getByText(/invalid.*credentials|incorrect.*password/i)).toBeVisible();
    });

    test('should show error with non-existent email', async ({ page }) => {
      await page.goto('/login');
      
      // Enter non-existent email
      await page.getByPlaceholderText(/email/i).fill('nonexistent@example.com');
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      // Should show error message
      await expect(page.getByText(/invalid.*credentials|user.*not.*found/i)).toBeVisible();
    });

    test('should successfully login with correct credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Enter correct credentials
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // User should see their dashboard
      await expect(page.getByText(/dashboard|welcome/i)).toBeVisible();
    });

    test('should have link to sign up page', async ({ page }) => {
      await page.goto('/login');
      
      // Should have link to sign up
      const signupLink = page.getByRole('link', { name: /don't have.*account|sign up/i });
      await expect(signupLink).toBeVisible();
      
      // Clicking should navigate to signup
      await signupLink.click();
      await expect(page).toHaveURL(/\/signup/);
    });
  });

  test.describe('Session Management', () => {
    
    test('should persist session across page refresh', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // Refresh the page
      await page.reload();
      
      // Should still be on dashboard (session persisted)
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText(/dashboard|welcome/i)).toBeVisible();
    });

    test('should show user email in navigation when logged in', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // User email or account button should be visible in nav
      await expect(page.getByText(new RegExp(TEST_USER.email.split('@')[0], 'i'))).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    
    test('should successfully logout and clear session', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // Find and click logout button
      const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
      await logoutButton.click();
      
      // Should redirect to home page
      await expect(page).toHaveURL('/', { timeout: 5000 });
      
      // Should see Get Started button (not logged in state)
      await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
    });

    test('should not be able to access protected routes after logout', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // Logout
      const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
      await logoutButton.click();
      
      await expect(page).toHaveURL('/', { timeout: 5000 });
      
      // Try to access dashboard directly
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      // Try to access dashboard without logging in
      await page.goto('/dashboard');
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing upload page without auth', async ({ page }) => {
      // Try to access upload page without logging in
      await page.goto('/upload');
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should allow access to dashboard after login', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // Should have access to dashboard
      await expect(page.getByText(/dashboard/i)).toBeVisible();
    });

    test('should allow public access to marketplace', async ({ page }) => {
      // Marketplace should be accessible without login
      await page.goto('/marketplace');
      
      // Should stay on marketplace (not redirect)
      await expect(page).toHaveURL(/\/marketplace/);
    });

    test('should allow public access to home page', async ({ page }) => {
      // Home should be accessible
      await page.goto('/');
      
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
    });
  });

  test.describe('Password Requirements', () => {
    
    test('should enforce minimum password length', async ({ page }) => {
      await page.goto('/signup');
      
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill('12345'); // 5 chars
      
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should show length requirement error
      await expect(page.locator('text=/6.*characters/i')).toBeVisible();
    });

    test('should display password requirements hint', async ({ page }) => {
      await page.goto('/signup');
      
      // Should show password requirements
      await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
    });
  });

  test.describe('Email Validation', () => {
    
    test('should reject empty email', async ({ page }) => {
      await page.goto('/signup');
      
      // Leave email empty
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should show required error
      await expect(page.locator('text=/email.*required/i')).toBeVisible();
    });

    test('should reject malformed email addresses', async ({ page }) => {
      await page.goto('/signup');
      
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com'
      ];
      
      for (const email of invalidEmails) {
        await page.getByPlaceholderText(/email/i).clear();
        await page.getByPlaceholderText(/email/i).fill(email);
        await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
        
        await page.getByRole('button', { name: /sign up/i }).click();
        
        // Should show validation error
        await expect(page.getByText(/invalid.*email|valid.*email/i)).toBeVisible();
      }
    });
  });

  test.describe('User Experience', () => {
    
    test('should show loading state during sign up', async ({ page }) => {
      await page.goto('/signup');
      
      await page.getByPlaceholderText(/email/i).fill(`new-${Date.now()}@example.com`);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      
      // Click submit
      const submitButton = page.getByRole('button', { name: /sign up/i });
      await submitButton.click();
      
      // Button should show loading state (disabled or loading text)
      await expect(submitButton).toBeDisabled();
    });

    test('should show loading state during login', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByPlaceholderText(/email/i).fill(TEST_USER.email);
      await page.getByPlaceholderText(/password/i).fill(TEST_USER.password);
      
      // Click submit
      const submitButton = page.getByRole('button', { name: /sign in|log in/i });
      await submitButton.click();
      
      // Button should show loading state
      await expect(submitButton).toBeDisabled();
    });

    test('should allow password visibility toggle', async ({ page }) => {
      await page.goto('/login');
      
      const passwordInput = page.getByPlaceholderText(/password/i);
      
      // Password should be hidden by default
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Look for toggle button (eye icon)
      const toggleButton = page.locator('button[aria-label*="password" i], button:has-text("👁")').first();
      
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        
        // Password should now be visible
        await expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });
  });
});
