import { test, expect } from "../fixtures/auth.fixture";
import { RoomPage } from "../page-objects";
import { DatabaseHelper } from "../helpers/database.helper";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe("RoomPage - Upload zdjęć pomieszczenia (room)", () => {
  let testUserId: string;
  let testRoomId: string;
  const testImagePath = path.join(__dirname, "../fixtures/test-image.jpg");

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

  test("2.1 - Upload zdjęcia room z opisem", async ({ authenticatedPage }) => {
    // Arrange
    const roomPage = new RoomPage(authenticatedPage);
    await roomPage.goto(testRoomId);
    await roomPage.waitForLoad();

    const testDescription = "Widok od wejścia - niewykonany stan";

    // Act - Wpisz opis
    await roomPage.roomPhotosSection.descriptionInput.fill(testDescription);

    // Act - Upload zdjęcia
    await roomPage.roomPhotosSection.fileInput.setInputFiles(testImagePath);
    await roomPage.roomPhotosSection.waitForUploadComplete();

    // Wait for photo to appear
    await authenticatedPage.waitForTimeout(1000);

    // Assert - Nowa karta zdjęcia zawiera wpisany opis
    const photoCards = roomPage.roomPhotosSection.getPhotoCards();
    await expect(photoCards.first()).toBeVisible();
    const cardDescription = photoCards.first().getByTestId("photo-card-description");
    await expect(cardDescription).toBeVisible();
    await expect(cardDescription).toHaveText(testDescription);

    // Assert - Pole opisu zostaje wyczyszczone
    const descriptionValue = await roomPage.roomPhotosSection.descriptionInput.inputValue();
    expect(descriptionValue).toBe("");

    // Assert - Licznik zwiększa się o 1
    const count = await roomPage.roomPhotosSection.getPhotoCount();
    expect(count.current).toBe(1);
  });

  test("2.2 - Wyświetlanie wielu zdjęć room", async ({ authenticatedPage }) => {
    // Arrange
    const roomPage = new RoomPage(authenticatedPage);
    await roomPage.goto(testRoomId);
    await roomPage.waitForLoad();

    // Act - Dodaj pierwsze zdjęcie
    await roomPage.roomPhotosSection.fileInput.setInputFiles(testImagePath);
    await roomPage.roomPhotosSection.waitForUploadComplete();
    await authenticatedPage.waitForTimeout(1000);

    const initialCount = await roomPage.roomPhotosSection.getPhotoCards().count();
    expect(initialCount).toBe(1);

    // Act - Dodaj kolejne zdjęcie
    await roomPage.roomPhotosSection.fileInput.setInputFiles(testImagePath);
    await roomPage.roomPhotosSection.waitForUploadComplete();
    await authenticatedPage.waitForTimeout(1000);

    // Assert - Nowe zdjęcie pojawia się w siatce
    const photoCards = roomPage.roomPhotosSection.getPhotoCards();
    const newCount = await photoCards.count();
    expect(newCount).toBe(2);

    // Assert - Wszystkie zdjęcia są widoczne w formie kart
    await expect(photoCards.nth(0)).toBeVisible();
    await expect(photoCards.nth(1)).toBeVisible();

    // Assert - Licznik pokazuje aktualną liczbę zdjęć
    const count = await roomPage.roomPhotosSection.getPhotoCount();
    expect(count.current).toBe(2);
  });
});
