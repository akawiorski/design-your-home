import { test as base, type Page } from "@playwright/test";

interface AuthFixtures {
  authenticatedPage: Page;
}

/**
 * Authentication fixture that logs in a test user before each test
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const username = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!username || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables must be set");
    }

    // Navigate to login page
    await page.goto("/login");

    // Fill in login form
    await page.getByLabel(/email/i).fill(username);
    await page.getByLabel(/hasło/i).fill(password);

    // Submit form and wait for navigation
    await Promise.all([page.waitForURL("/dashboard"), page.getByRole("button", { name: /zaloguj/i }).click()]);

    // Use the authenticated page in the test
    await use(page);
  },
});

export { expect } from "@playwright/test";
