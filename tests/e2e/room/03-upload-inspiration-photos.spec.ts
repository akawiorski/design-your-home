import { test, expect } from "../fixtures/auth.fixture";
import { RoomPage } from "../page-objects";
import { DatabaseHelper } from "../helpers/database.helper";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe("RoomPage - Upload zdjęć inspiracji (inspiration)", () => {
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

  test("3.1 - Upload pierwszego zdjęcia inspiration", async ({ authenticatedPage }) => {
    // Arrange
    const roomPage = new RoomPage(authenticatedPage);
    await roomPage.goto(testRoomId);
    await roomPage.waitForLoad();

    // Verify initial state
    const initialCount = await roomPage.inspirationPhotosSection.getPhotoCards().count();
    expect(initialCount).toBe(0);

    // Act - Upload zdjęcia
    await roomPage.inspirationPhotosSection.fileInput.setInputFiles(testImagePath);
    await roomPage.inspirationPhotosSection.waitForUploadComplete();
    await authenticatedPage.waitForTimeout(1000);

    // Assert - Nowa karta zdjęcia pojawia się w sekcji
    const photoCards = roomPage.inspirationPhotosSection.getPhotoCards();
    await expect(photoCards.first()).toBeVisible();

    // Assert - Licznik zmienia się na "inspiration: 1/2"
    const count = await roomPage.inspirationPhotosSection.getPhotoCount();
    expect(count.current).toBe(1);
    expect(count.required).toBe(2);

    // Assert - Tracker wymagań pokazuje niespełniony wymóg (1/2)
    const isInspirationFulfilled = await roomPage.requirementsTracker.isInspirationRequirementFulfilled();
    expect(isInspirationFulfilled).toBe(false);

    const trackerCount = await roomPage.requirementsTracker.getInspirationCount();
    expect(trackerCount.current).toBe(1);
    expect(trackerCount.required).toBe(2);
  });

  test("3.2 - Upload dwóch zdjęć inspiration - spełnienie wymogu", async ({ authenticatedPage }) => {
    // Arrange - Dodaj już jedno zdjęcie inspiration
    const roomPage = new RoomPage(authenticatedPage);
    await roomPage.goto(testRoomId);
    await roomPage.waitForLoad();

    // Act - Upload zdjęcia
    await roomPage.inspirationPhotosSection.fileInput.setInputFiles(testImagePath);
    await roomPage.inspirationPhotosSection.waitForUploadComplete();
    await authenticatedPage.waitForTimeout(1000);

    // Assert - Nowa karta zdjęcia pojawia się w sekcji
    const photoCards = roomPage.inspirationPhotosSection.getPhotoCards();
    await expect(photoCards.first()).toBeVisible();

    // Assert - Licznik zmienia się na "inspiration: 1/2"
    const count = await roomPage.inspirationPhotosSection.getPhotoCount();
    expect(count.current).toBe(1);
    expect(count.required).toBe(2);

    // Act - Dodaj drugie zdjęcie
    await roomPage.inspirationPhotosSection.fileInput.setInputFiles(testImagePath);
    await roomPage.inspirationPhotosSection.waitForUploadComplete();
    await authenticatedPage.waitForTimeout(1000);

    // Assert - Licznik zmienia się na "inspiration: 2/2"
    const count2 = await roomPage.inspirationPhotosSection.getPhotoCount();
    expect(count2.current).toBe(2);
    expect(count2.required).toBe(2);

    // Assert - Tracker wymagań pokazuje spełniony wymóg (2/2)
    const isInspirationFulfilled = await roomPage.requirementsTracker.isInspirationRequirementFulfilled();
    expect(isInspirationFulfilled).toBe(true);

    const trackerCount = await roomPage.requirementsTracker.getInspirationCount();
    expect(trackerCount.current).toBe(2);
    expect(trackerCount.required).toBe(2);
  });

  test("3.3 - Upload zdjęcia inspiration z opisem", async ({ authenticatedPage }) => {
    // Arrange
    const roomPage = new RoomPage(authenticatedPage);
    await roomPage.goto(testRoomId);
    await roomPage.waitForLoad();

    const testDescription = "Inspiracja - nowoczesny styl skandynawski";

    // Act - Wpisz opis
    await roomPage.inspirationPhotosSection.descriptionInput.fill(testDescription);

    // Act - Upload zdjęcia
    await roomPage.inspirationPhotosSection.fileInput.setInputFiles(testImagePath);
    await roomPage.inspirationPhotosSection.waitForUploadComplete();
    await authenticatedPage.waitForTimeout(1000);

    // Assert - Nowa karta zdjęcia zawiera wpisany opis
    const photoCards = roomPage.inspirationPhotosSection.getPhotoCards();
    await expect(photoCards.first()).toBeVisible();
    const cardDescription = photoCards.first().getByTestId("photo-card-description");
    await expect(cardDescription).toBeVisible();
    await expect(cardDescription).toHaveText(testDescription);

    // Assert - Pole opisu zostaje wyczyszczone
    const descriptionValue = await roomPage.inspirationPhotosSection.descriptionInput.inputValue();
    expect(descriptionValue).toBe("");
  });
});
