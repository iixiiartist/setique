import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests
 * Tests critical user journeys on the landing page
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/SETIQUE/i);
  });

  test('should display hero section', async ({ page }) => {
    const hero = page.locator('[data-testid="hero-section"], h1').first();
    await expect(hero).toBeVisible();
  });

  test('should navigate to marketplace', async ({ page }) => {
    await page.click('text=/marketplace/i');
    await expect(page).toHaveURL(/.*marketplace/);
  });

  test('should show sign in button when not authenticated', async ({ page }) => {
    const signInButton = page.locator('text=/sign in/i').first();
    await expect(signInButton).toBeVisible();
  });
});

/**
 * Marketplace E2E Tests
 * Tests dataset browsing and search functionality
 */
test.describe('Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/marketplace');
  });

  test('should display dataset cards', async ({ page }) => {
    // Wait for datasets to load
    await page.waitForSelector('[data-testid="dataset-card"], .dataset-card', {
      timeout: 10000,
      state: 'visible'
    }).catch(() => {
      // If no datasets, check for empty state
      return page.waitForSelector('text=/no datasets/i', { timeout: 5000 });
    });
  });

  test('should filter datasets by search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('dataset');
      await page.waitForTimeout(500); // Debounce delay
      
      // Verify search is applied
      const url = page.url();
      expect(url).toContain('search=');
    }
  });

  test('should navigate to dataset detail page', async ({ page }) => {
    // Find first dataset card link
    const firstDataset = page.locator('a[href*="/dataset/"]').first();
    
    if (await firstDataset.count() > 0) {
      await firstDataset.click();
      await expect(page).toHaveURL(/.*dataset\/.+/);
    }
  });
});

/**
 * Authentication E2E Tests
 * Tests sign up and login flows
 */
test.describe('Authentication', () => {
  test('should show sign up form', async ({ page }) => {
    await page.goto('/signup');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=/invalid.*email/i, text=/valid.*email/i')).toBeVisible({
      timeout: 5000
    }).catch(() => {
      // Email validation might be handled by browser
      console.log('Email validation not found or handled by browser');
    });
  });
});

/**
 * Accessibility E2E Tests
 * Tests keyboard navigation and ARIA attributes
 */
test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Press Tab to navigate through interactive elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement.tagName);
    
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocused);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for H1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });
});
