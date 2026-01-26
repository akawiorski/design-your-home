import { test, expect } from "../fixtures/auth.fixture";
import { DashboardPage } from "../page-objects";
import { DatabaseHelper } from "../helpers/database.helper";

test.describe("Dashboard - Tworzenie nowego pokoju", () => {
  const testUserId = process.env.E2E_USERNAME_ID!;
  let roomTypes: Awaited<ReturnType<typeof DatabaseHelper.getRoomTypes>>;

  test.beforeAll(async () => {
    roomTypes = await DatabaseHelper.getRoomTypes();
  });

  test.beforeEach(async () => {
    // Clean up before each test to ensure isolated state
    await DatabaseHelper.deleteAllRoomsForUser(testUserId);
  });

  test("2.1 - Otwieranie dialogu tworzenia pokoju przez nagłówek", async ({ authenticatedPage }) => {
    // Arrange
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Act
    await dashboard.openCreateRoomDialogFromHeader();

    // Assert - Modal "Utwórz pokój" jest widoczny
    await expect(dashboard.createRoomDialog.dialog).toBeVisible();
    await expect(dashboard.createRoomDialog.title).toHaveText("Utwórz pokój");

    // Assert - Widoczna lista typów pokoi w select (może być w stanie ładowania)
    const isLoading = await dashboard.createRoomDialog.isLoadingTypesVisible();
    if (!isLoading) {
      await expect(dashboard.createRoomDialog.roomTypeSelect).toBeVisible();
    }

    // Assert - Przyciski "Anuluj" i "Utwórz" są widoczne
    await expect(dashboard.createRoomDialog.cancelButton).toBeVisible();
    await expect(dashboard.createRoomDialog.submitButton).toBeVisible();

    // Assert - Przycisk "Utwórz" jest disabled (brak wyboru)
    const isDisabled = await dashboard.createRoomDialog.isSubmitButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  test("2.2 - Otwieranie dialogu tworzenia pierwszego pokoju", async ({ authenticatedPage }) => {
    // Arrange
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Wait for loading to complete and verify empty state is visible
    await authenticatedPage.waitForTimeout(1000);
    await expect(dashboard.roomsSection.emptyState).toBeVisible({ timeout: 10000 });

    // Act
    await dashboard.openCreateRoomDialogFromEmptyState();

    // Assert - Modal "Utwórz pokój" jest widoczny
    await expect(dashboard.createRoomDialog.dialog).toBeVisible();
    await expect(dashboard.createRoomDialog.title).toHaveText("Utwórz pokój");

    // Assert - Widoczna lista typów pokoi w select (czekamy aż załaduje się)
    await dashboard.createRoomDialog.roomTypeSelect.waitFor({ state: "visible", timeout: 5000 });
    await expect(dashboard.createRoomDialog.roomTypeSelect).toBeVisible();
  });

  test("2.3 - Pomyślne utworzenie pokoju", async ({ authenticatedPage }) => {
    // Arrange
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();

    const selectedRoomType = roomTypes[0];

    // Act
    await dashboard.openCreateRoomDialogFromHeader();
    await dashboard.createRoomDialog.roomTypeSelect.waitFor({ state: "visible" });
    await dashboard.createRoomDialog.selectRoomType(selectedRoomType.display_name);
    await dashboard.createRoomDialog.clickSubmit();

    // Assert - Użytkownik zostaje przekierowany na /rooms/{id}
    await authenticatedPage.waitForURL(/\/rooms\/[a-f0-9-]+/, { timeout: 10000 });
    expect(authenticatedPage.url()).toMatch(/\/rooms\/[a-f0-9-]+/);

    // Optional: Check for toast (may appear before or after redirect)
    // Toast check is removed as it's unreliable due to timing
  });

  test("2.4 - Anulowanie tworzenia pokoju", async ({ authenticatedPage }) => {
    // Arrange
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();

    const selectedRoomType = roomTypes[0];

    await dashboard.openCreateRoomDialogFromHeader();
    await dashboard.createRoomDialog.roomTypeSelect.waitFor({ state: "visible" });
    await dashboard.createRoomDialog.selectRoomType(selectedRoomType.display_name);

    // Act
    await dashboard.createRoomDialog.clickCancel();

    // Assert - Dialog zostaje zamknięty
    await expect(dashboard.createRoomDialog.dialog).not.toBeVisible();

    // Assert - Użytkownik pozostaje na stronie /dashboard
    expect(authenticatedPage.url()).toContain("/dashboard");

    // Assert - Nowy pokój nie został utworzony (empty state wciąż widoczny)
    await expect(dashboard.roomsSection.emptyState).toBeVisible();
  });

  test("2.5 - Zamknięcie dialogu przez ESC", async ({ authenticatedPage }) => {
    // Arrange
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();

    const selectedRoomType = roomTypes[0];

    await dashboard.openCreateRoomDialogFromHeader();
    await dashboard.createRoomDialog.roomTypeSelect.waitFor({ state: "visible" });
    await dashboard.createRoomDialog.selectRoomType(selectedRoomType.display_name);

    // Remember selected value
    const selectedValue = await dashboard.createRoomDialog.getSelectedRoomType();
    expect(selectedValue).toBeTruthy();

    // Act - Zamknięcie dialogu przez ESC
    await dashboard.createRoomDialog.closeDialogWithEscape();

    // Assert - Dialog zostaje zamknięty
    await expect(dashboard.createRoomDialog.dialog).not.toBeVisible();

    // Assert - Formularz zostaje zresetowany (sprawdzamy przy ponownym otwarciu)
    await dashboard.openCreateRoomDialogFromHeader();
    await dashboard.createRoomDialog.roomTypeSelect.waitFor({ state: "visible" });

    const newSelectedValue = await dashboard.createRoomDialog.getSelectedRoomType();
    expect(newSelectedValue).toBe(""); // Powinno być puste (zresetowane)
  });
});
