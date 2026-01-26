import { test, expect } from "../fixtures/auth.fixture";
import { DashboardPage } from "../page-objects";
import { DatabaseHelper } from "../helpers/database.helper";

test.describe("Dashboard - Podstawowe wyświetlanie strony", () => {
  const testUserId = process.env.E2E_USERNAME_ID!;

  test.beforeEach(async () => {
    // Clean up before each test to ensure isolated state
    await DatabaseHelper.deleteAllRoomsForUser(testUserId);
  });

  test("1.1 - Wyświetlanie pustego dashboardu (pierwszy użytkownik)", async ({ authenticatedPage }) => {
    // Arrange
    const dashboard = new DashboardPage(authenticatedPage);

    // Act
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Wait for loading state to disappear and empty state to appear
    await dashboard.roomsSection.emptyState.waitFor({ state: "visible", timeout: 15000 });

    // Assert - Nagłówek "Dashboard"
    await expect(dashboard.header.title).toBeVisible();
    await expect(dashboard.header.title).toHaveText("Dashboard");

    // Assert - Przycisk "Utwórz pokój" w nagłówku
    await expect(dashboard.header.createRoomButton).toBeVisible();
    await expect(dashboard.header.createRoomButton).toHaveText("Utwórz pokój");

    // Assert - Sekcja "Twoje pokoje"
    await expect(dashboard.roomsSection.section).toBeVisible();
    await expect(dashboard.roomsSection.title).toHaveText("Twoje pokoje");

    // Assert - Komunikat "Brak pokoi"
    await expect(dashboard.roomsSection.emptyState).toBeVisible();
    await expect(dashboard.roomsSection.emptyStateTitle).toHaveText("Brak pokoi");

    // Assert - Przycisk "Stwórz swój pierwszy pokój"
    await expect(dashboard.roomsSection.createFirstRoomButton).toBeVisible();
    await expect(dashboard.roomsSection.createFirstRoomButton).toHaveText("Stwórz swój pierwszy pokój");
  });

  test("1.2 - Wyświetlanie dashboardu z pokojami", async ({ authenticatedPage }) => {
    // Arrange - Create test rooms
    const roomTypes = await DatabaseHelper.getRoomTypes();
    const firstRoomType = roomTypes[0];
    const secondRoomType = roomTypes[1];

    await DatabaseHelper.createRoomForUser(testUserId, firstRoomType.id);
    await DatabaseHelper.createRoomForUser(testUserId, secondRoomType.id);

    const dashboard = new DashboardPage(authenticatedPage);

    // Act
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Assert - Nagłówek "Dashboard"
    await expect(dashboard.header.title).toBeVisible();
    await expect(dashboard.header.title).toHaveText("Dashboard");

    // Assert - Lista kart pokoi w siatce
    await expect(dashboard.roomsSection.roomsGrid).toBeVisible();

    // Assert - Minimum 2 karty pokoi
    const roomsCount = await dashboard.getRoomsCount();
    expect(roomsCount).toBeGreaterThanOrEqual(2);

    // Assert - Każda karta zawiera wymagane elementy
    const firstCard = dashboard.getRoomCard(0);
    await expect(firstCard.card).toBeVisible();
    await expect(firstCard.title).toBeVisible();

    // Assert - Karta zawiera nazwę typu pokoju
    const titleText = await firstCard.getTitleText();
    expect(titleText).toBeTruthy();

    // Assert - Karta zawiera informacje o liczbie zdjęć (sprawdzamy czy tekst zawiera "Zdjęcia:")
    await expect(firstCard.card).toContainText("Zdjęcia:");

    // Assert - Karta zawiera daty (sprawdzamy czy są widoczne sekcje dat)
    await expect(firstCard.card).toContainText("Utworzono");
    await expect(firstCard.card).toContainText("Aktualizacja");
  });
});
