import { test, expect } from "../fixtures/auth.fixture";
import { RoomPage } from "../page-objects";
import { DatabaseHelper } from "../helpers/database.helper";

test.describe("RoomPage - Podstawowe wyświetlanie strony pokoju", () => {
  let testUserId: string;
  let testRoomId: string;

  test.beforeAll(async () => {
    testUserId = process.env.E2E_USERNAME_ID!;
  });

  test.beforeEach(async () => {
    // Clean up and create test room
    await DatabaseHelper.deleteAllRoomsForUser(testUserId);

    const roomTypes = await DatabaseHelper.getRoomTypes();
    const room = await DatabaseHelper.createRoomForUser(testUserId, roomTypes[0].id);
    testRoomId = room.id;
  });

  test("1.1 - Wyświetlanie pustego pokoju (bez zdjęć)", async ({ authenticatedPage }) => {
    // Arrange
    const roomPage = new RoomPage(authenticatedPage);

    // Act
    await roomPage.goto(testRoomId);
    await roomPage.waitForLoad();

    // Assert - Nagłówek z nazwą typu pokoju
    await expect(roomPage.header.header).toBeVisible();
    const roomTitle = await roomPage.header.getRoomTitle();
    expect(roomTitle.length).toBeGreaterThan(0);

    // Assert - Link powrotny
    await expect(roomPage.header.backToDashboardLink).toBeVisible();
    await expect(roomPage.header.backToDashboardLink).toHaveText("← Wróć do dashboardu");

    // Assert - Daty utworzenia i aktualizacji
    await expect(roomPage.header.createdDate).toBeVisible();
    await expect(roomPage.header.updatedDate).toBeVisible();

    // Assert - Sekcja "Zdjęcia pomieszczenia"
    await expect(roomPage.roomPhotosSection.section).toBeVisible();
    await expect(roomPage.roomPhotosSection.title).toBeVisible();
    await expect(roomPage.roomPhotosSection.description).toBeVisible();

    // Assert - Sekcja "Zdjęcia inspiracji"
    await expect(roomPage.inspirationPhotosSection.section).toBeVisible();
    await expect(roomPage.inspirationPhotosSection.title).toBeVisible();
    await expect(roomPage.inspirationPhotosSection.description).toBeVisible();

    // Assert - Tracker wymagań z licznikami (0/1 room, 0/2 inspiration)
    await expect(roomPage.requirementsTracker.tracker).toBeVisible();
    const roomCount = await roomPage.requirementsTracker.getRoomCount();
    const inspirationCount = await roomPage.requirementsTracker.getInspirationCount();
    expect(roomCount.current).toBe(0);
    expect(roomCount.required).toBe(1);
    expect(inspirationCount.current).toBe(0);
    expect(inspirationCount.required).toBe(2);

    // Assert - Obie sekcje zdjęć są puste
    const roomPhotosCount = await roomPage.roomPhotosSection.getPhotoCards().count();
    const inspirationPhotosCount = await roomPage.inspirationPhotosSection.getPhotoCards().count();
    expect(roomPhotosCount).toBe(0);
    expect(inspirationPhotosCount).toBe(0);

    // Assert - Przyciski upload są aktywne
    const isRoomUploadEnabled = await roomPage.roomPhotosSection.isUploadEnabled();
    const isInspirationUploadEnabled = await roomPage.inspirationPhotosSection.isUploadEnabled();
    expect(isRoomUploadEnabled).toBe(true);
    expect(isInspirationUploadEnabled).toBe(true);
  });
});
