# SETIQUE Test Suite

This directory contains all automated tests for the SETIQUE platform.

## Directory Structure

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
│   └── homepage.spec.js    # Homepage and critical flows
├── performance/            # Performance and load tests
│   └── load-test.js       # k6 load testing script
└── README.md              # This file
```

## Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run load tests (requires k6)
k6 run tests/performance/load-test.js
```

## Unit Tests Location

Unit tests are colocated with source code in `src/`:
- `src/components/**/*.test.jsx` - Component tests
- `src/lib/**/*.test.js` - Utility function tests
- `src/test/setup.js` - Global test setup

## Adding New Tests

### E2E Tests

1. Create a new file in `tests/e2e/` with `.spec.js` extension
2. Follow the pattern in `homepage.spec.js`
3. Use data-testid attributes for stable selectors
4. Run `npm run test:e2e:ui` to develop interactively

### Unit Tests

1. Create a `.test.jsx` file next to your component
2. Import testing utilities from `@testing-library/react`
3. Include accessibility tests with `jest-axe`
4. Run `npm test` in watch mode

## Test Coverage

Generate coverage reports:

```bash
npm run test:coverage
```

View HTML report: `coverage/index.html`

## CI/CD

All tests run automatically on GitHub Actions:
- **Pull Requests**: Unit + E2E + Lighthouse
- **Main Branch**: All tests + Security scan

## Resources

See [TESTING_GUIDE.md](../docs/TESTING_GUIDE.md) for comprehensive documentation.
