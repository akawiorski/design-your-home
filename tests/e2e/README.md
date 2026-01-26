# E2E Tests

End-to-end tests for the Design Your Home application using Playwright.

## Structure

```
tests/e2e/
├── global-setup.ts         # Global setup (runs once before all tests)
├── global-teardown.ts      # Global teardown (runs once after all tests)
├── dashboard/              # Dashboard page tests
│   ├── 01-basic-display.spec.ts
│   ├── 02-create-room.spec.ts
│   └── 03-room-navigation.spec.ts
├── fixtures/               # Test fixtures
│   └── auth.fixture.ts     # Authentication setup
├── helpers/                # Test helpers
│   └── database.helper.ts  # Database operations
└── page-objects/           # Page Object Models
    ├── dashboard.page.ts
    ├── dashboard-header.page.ts
    ├── rooms-section.page.ts
    ├── room-card.page.ts
    ├── create-room-dialog.page.ts
    └── index.ts
```

## Global Setup and Teardown

The test suite uses Playwright's global setup and teardown hooks:

- **Global Setup** (`global-setup.ts`):
  - Validates environment variables
  - Cleans up any leftover data from previous runs
  - Verifies database connectivity
  - Ensures room types are available

- **Global Teardown** (`global-teardown.ts`):
  - Cleans up all test data after test suite completes
  - Deletes all rooms created during tests
  - Runs even if tests fail

Each test also has its own `beforeEach` hook that ensures a clean state before running.

## Setup

1. Copy `.env.example` to `.env` and fill in the required values:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_KEY` - Your Supabase service role key
   - `E2E_USERNAME_ID` - Test user ID (UUID)
   - `E2E_USERNAME` - Test user email
   - `E2E_PASSWORD` - Test user password

2. Ensure the test user exists in your Supabase database.

3. Install dependencies:
   ```bash
   npm install
   ```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/dashboard/01-basic-display.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Debug tests
npx playwright test --debug
```

## Writing Tests

### Using Page Object Model

```typescript
import { test, expect } from "../fixtures/auth.fixture";
import { DashboardPage } from "../page-objects";

test("my test", async ({ authenticatedPage }) => {
  // Arrange
  const dashboard = new DashboardPage(authenticatedPage);
  
  // Act
  await dashboard.goto();
  await dashboard.openCreateRoomDialogFromHeader();
  
  // Assert
  await expect(dashboard.createRoomDialog.dialog).toBeVisible();
});
```

### Test Structure

Follow the **Arrange-Act-Assert (AAA)** pattern:

```typescript
test("descriptive test name", async ({ authenticatedPage }) => {
  // Arrange - Set up test data and initial state
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Act - Perform the action being tested
  await dashboard.header.clickCreateRoom();
  
  // Assert - Verify the expected outcome
  await expect(dashboard.createRoomDialog.dialog).toBeVisible();
});
```

### Authentication

Tests automatically use the authenticated user via the `authenticatedPage` fixture:

```typescript
test("my test", async ({ authenticatedPage }) => {
  // User is already logged in
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
});
```

### Database Helpers

Use `DatabaseHelper` for test setup and cleanup:

```typescript
import { DatabaseHelper } from "../helpers/database.helper";

test.beforeEach(async () => {
  // Clean up test data
  await DatabaseHelper.deleteAllRoomsForUser(testUserId);
  
  // Create test data
  const room = await DatabaseHelper.createRoomForUser(testUserId, roomTypeId);
});
```

## Best Practices

1. **Use data-testid selectors** - All interactive elements have `data-testid` attributes
2. **Clean up test data** - Use `beforeEach` to ensure clean state
3. **Use Page Object Model** - Keep selectors and actions in page objects
4. **Follow AAA pattern** - Structure tests with clear Arrange-Act-Assert sections
5. **Wait for elements** - Use `waitFor()` and built-in assertions that auto-wait
6. **Descriptive test names** - Use clear, descriptive test names that explain what is being tested

## Debugging

### View test traces

```bash
npx playwright show-trace trace.zip
```

### Generate trace on demand

```bash
npx playwright test --trace on
```

### View test report

```bash
npx playwright show-report
```

## CI/CD

Tests are configured to run in CI with:
- Automatic retries on failure
- Screenshots on failure
- Video recording on failure
- Trace recording on first retry
