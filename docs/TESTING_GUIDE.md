# Testing Guide for SETIQUE

This guide covers the complete testing infrastructure for SETIQUE, including unit tests, E2E tests, accessibility testing, performance testing, and security scanning.

## Table of Contents

- [Quick Start](#quick-start)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Best Practices](#best-practices)

## Quick Start

```bash
# Install dependencies
npm install

# Run all unit tests
npm test

# Run unit tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run tests with coverage
npm run test:coverage
```

## Testing Stack

### Unit & Integration Tests
- **Vitest**: Fast unit test runner (Jest-compatible)
- **@testing-library/react**: Test React components as users interact with them
- **jest-axe**: Automated accessibility testing
- **jsdom**: Browser environment simulation

### E2E Tests
- **Playwright**: Cross-browser end-to-end testing
- Supports Chrome, Firefox, Safari, and mobile viewports
- Built-in screenshot and video recording on failure

### Performance Testing
- **Lighthouse**: Web performance, accessibility, and SEO audits
- **k6**: Load testing for API endpoints

### Security Testing
- **OWASP ZAP**: Automated security vulnerability scanning

## Running Tests

### Unit Tests

```bash
# Watch mode (default)
npm test

# Run once
npm run test:run

# With UI dashboard
npm run test:ui

# With coverage report
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with Playwright UI (interactive)
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/homepage.spec.js

# Run tests for specific browser
npx playwright test --project=chromium
```

### Accessibility Tests

```bash
# Run only accessibility-tagged tests
npm run test:a11y
```

### Performance Testing

```bash
# Lighthouse audit (requires dev server running)
npm run dev  # In one terminal
npm run lighthouse  # In another terminal
```

Report saved to `reports/lighthouse-report.html`.

### Load Testing with k6

```bash
# Install k6
# Windows (Chocolatey): choco install k6
# Mac: brew install k6
# Linux: See https://k6.io/docs/get-started/installation/

# Run load test
k6 run tests/performance/load-test.js

# Run with custom URL
k6 run -e BASE_URL=https://setique.app tests/performance/load-test.js
```

### Security Scanning

```bash
# Requires Docker and running dev server
npm run dev  # In one terminal

# Run OWASP ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://host.docker.internal:5173 \
  -r zap-report.html
```

## Writing Tests

### Unit Test Structure

Create test files alongside your components with `.test.jsx` or `.spec.jsx` extension:

```jsx
// src/components/Button.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Button from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be accessible', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### E2E Test Structure

Create test files in `tests/e2e/` with `.spec.js` extension:

```javascript
// tests/e2e/checkout.spec.js
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('complete purchase flow', async ({ page }) => {
    // Navigate to marketplace
    await page.goto('/marketplace');
    
    // Find and click first dataset
    await page.click('[data-testid="dataset-card"]');
    
    // Click purchase button
    await page.click('button:has-text("Purchase")');
    
    // Verify redirect to checkout
    await expect(page).toHaveURL(/.*checkout/);
    
    // Fill payment form
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    
    // Submit payment
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=/success/i')).toBeVisible();
  });
});
```

### Testing Supabase Interactions

Mock Supabase in unit tests:

```javascript
import { vi } from 'vitest';
import { supabase } from '@/lib/supabase';

// Mock the entire supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test Dataset' }],
          error: null
        }))
      }))
    }))
  }
}));

test('fetches datasets', async () => {
  const datasets = await fetchDatasets();
  expect(datasets).toHaveLength(1);
  expect(datasets[0].name).toBe('Test Dataset');
});
```

### Accessibility Testing Patterns

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('page has no accessibility violations', async () => {
  const { container } = render(<MyPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// Test specific WCAG rules
test('has proper color contrast', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container, {
    rules: {
      'color-contrast': { enabled: true }
    }
  });
  expect(results).toHaveNoViolations();
});
```

## VS Code Integration

### Running Tests from Command Palette

1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type "Tasks: Run Task"
3. Select from:
   - Run Unit Tests
   - Run Unit Tests (UI)
   - Run E2E Tests
   - Run E2E Tests (UI)
   - Run Lighthouse Audit
   - Run All Tests

### Keyboard Shortcuts

Add to `.vscode/keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+t",
    "command": "workbench.action.tasks.runTask",
    "args": "Run Unit Tests"
  }
]
```

## CI/CD Integration

Tests run automatically on GitHub Actions for:
- Every push to `main` or `develop` branches
- Every pull request

### CI Pipeline Stages

1. **Lint & Unit Tests**: Runs on Node 18.x and 20.x
2. **E2E Tests**: Runs after unit tests pass
3. **Lighthouse Audit**: Performance scoring
4. **Security Scan**: OWASP ZAP (main branch only)

### Viewing CI Results

- Go to GitHub repository → Actions tab
- Click on latest workflow run
- Download artifacts (coverage, Playwright reports, Lighthouse reports)

## Performance Testing

### Lighthouse Metrics

Key metrics to monitor:
- **Performance**: Target > 80
- **Accessibility**: Target > 90
- **Best Practices**: Target > 90
- **SEO**: Target > 90

### k6 Load Testing

Customize load test scenarios in `tests/performance/load-test.js`:

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};
```

## Security Testing

### OWASP ZAP Baseline Scan

Tests for common vulnerabilities:
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- SQL Injection
- Insecure headers
- Cookie security

### Manual Security Checklist

- [ ] Authentication works correctly
- [ ] Admin routes require proper permissions
- [ ] User data is properly isolated
- [ ] File uploads are validated
- [ ] API rate limiting is in place
- [ ] HTTPS is enforced in production

## Best Practices

### Unit Tests

1. **Test behavior, not implementation**: Test what users see and do
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Keep tests isolated**: No shared state between tests
4. **Test edge cases**: Empty states, loading states, error states
5. **Mock external dependencies**: Supabase, Stripe, external APIs

### E2E Tests

1. **Test critical user journeys**: Sign up, purchase, upload dataset
2. **Use data-testid for stability**: Less brittle than CSS selectors
3. **Wait for elements explicitly**: Use `waitForSelector`, not `waitForTimeout`
4. **Test across browsers**: Run on Chrome, Firefox, Safari
5. **Keep tests independent**: Each test should set up its own state

### Accessibility Tests

1. **Run axe on every component**: Add to component test suites
2. **Manual keyboard testing**: Tab through entire flow
3. **Screen reader testing**: Test with NVDA or VoiceOver
4. **Check color contrast**: Use browser DevTools
5. **Test with actual users**: Nothing beats real user feedback

### Performance Tests

1. **Set realistic thresholds**: Based on your user base
2. **Test on production-like data**: Use realistic dataset sizes
3. **Monitor trends**: Track performance over time
4. **Optimize before shipping**: Don't ship slow features
5. **Test on real devices**: Mobile performance matters

## Common Issues & Solutions

### Issue: Tests timeout

```javascript
// Increase timeout for slow operations
test('slow operation', async () => {
  // ...
}, { timeout: 30000 }); // 30 seconds
```

### Issue: Flaky E2E tests

```javascript
// Use proper waits
await page.waitForSelector('[data-testid="loaded"]', { state: 'visible' });

// Not this:
await page.waitForTimeout(1000); // ❌ Unreliable
```

### Issue: Mock not working

```javascript
// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Issue: Can't select element

```javascript
// Add data-testid attributes
<button data-testid="submit-button">Submit</button>

// Then use in tests
await page.click('[data-testid="submit-button"]');
```

## Test Templates

### Component Test Template

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    // Add assertions
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    // Add interactions
  });

  it('is accessible', async () => {
    const { container } = render(<YourComponent />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### E2E Test Template

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
  });

  test('user can complete action', async ({ page }) => {
    // Arrange
    
    // Act
    
    // Assert
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [k6 Documentation](https://k6.io/docs/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Getting Help

- Check existing test files for examples
- Use Copilot to generate test scaffolds
- Use Claude Sonnet agent mode for complex test scenarios
- Review CI logs for failure details
- Ask in team chat for testing questions

---

**Remember**: Tests are living documentation. Keep them up to date as features evolve! 🧪
