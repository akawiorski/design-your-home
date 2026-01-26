import { test, expect } from "../fixtures/auth.fixture";
import { DashboardPage } from "../page-objects";
import { DatabaseHelper } from "../helpers/database.helper";
test.describe("Dashboard - Nawigacja do szczegółów pokoju", () => {
  const testUserId = process.env.E2E_USERNAME_ID!;
  let testRoomId: string;

  test.beforeEach(async () => {
    // Clean up and create test room before each test
    await DatabaseHelper.deleteAllRoomsForUser(testUserId);

    const roomTypes = await DatabaseHelper.getRoomTypes();
    const room = await DatabaseHelper.createRoomForUser(testUserId, roomTypes[0].id);
    testRoomId = room.id;
  });

  test("3.1 - Przejście do szczegółów pokoju przez kliknięcie karty", async ({ authenticatedPage }) => {
    // Arrange
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Wait for loading to complete
    await authenticatedPage.waitForTimeout(1000);

    // Verify room card is visible
    await expect(dashboard.roomsSection.roomsGrid).toBeVisible({ timeout: 10000 });
    const firstCard = dashboard.getRoomCard(0);
    await expect(firstCard.card).toBeVisible({ timeout: 5000 });

    // Act
    await firstCard.waitForNavigation();

    // Assert - Użytkownik zostaje przekierowany na /rooms/{id}
    await authenticatedPage.waitForLoadState("domcontentloaded");
    expect(authenticatedPage.url()).toMatch(/\/rooms\/[a-f0-9-]+/);
    expect(authenticatedPage.url()).toContain(`/rooms/${testRoomId}`);
  });

  test("3.2 - Hover na karcie pokoju", async ({ authenticatedPage }) => {
    // Arrange
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Wait for network to settle
    await authenticatedPage.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

    // Ensure rooms grid is visible first
    await expect(dashboard.roomsSection.roomsGrid).toBeVisible({ timeout: 10000 });

    const firstCard = dashboard.getRoomCard(0);
    await expect(firstCard.card).toBeVisible({ timeout: 5000 });

    // Get initial state (no hover)
    const initialBgColor = await firstCard.card.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Act - Hover over the card
    await firstCard.hover();

    // Small delay to allow CSS transition
    await authenticatedPage.waitForTimeout(100);

    // Assert - Karta zmienia wygląd (hover state)
    const hoverBgColor = await firstCard.card.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background color should change on hover
    expect(hoverBgColor).not.toBe(initialBgColor);

    // Assert - Verify the card has hover classes applied
    const hasHoverClass = await firstCard.card.evaluate((el) => {
      return el.className.includes("hover:bg-accent");
    });
    expect(hasHoverClass).toBe(true);

    // Assert - Strzałka "→" is visible (part of the card content)
    await expect(firstCard.card).toContainText("→");
  });
});
