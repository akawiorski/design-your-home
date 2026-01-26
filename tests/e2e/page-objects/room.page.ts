import type { Page } from "@playwright/test";
import { RoomHeaderPage } from "./room-header.page";
import { PhotosSectionPage } from "./photos-section.page";
import { PhotoRequirementsTrackerPage } from "./photo-requirements-tracker.page";

/**
 * Main Page Object Model for Room Page
 * Composite pattern - aggregates all room page components
 */
export class RoomPage {
  readonly page: Page;
  readonly header: RoomHeaderPage;
  readonly roomPhotosSection: PhotosSectionPage;
  readonly inspirationPhotosSection: PhotosSectionPage;
  readonly requirementsTracker: PhotoRequirementsTrackerPage;

  constructor(page: Page) {
    this.page = page;
    this.header = new RoomHeaderPage(page);
    this.roomPhotosSection = new PhotosSectionPage(page, "room");
    this.inspirationPhotosSection = new PhotosSectionPage(page, "inspiration");
    this.requirementsTracker = new PhotoRequirementsTrackerPage(page);
  }

  /**
   * Navigate to room page by ID
   */
  async goto(roomId: string) {
    await this.page.goto(`/rooms/${roomId}`);
  }

  /**
   * Wait for the page to load completely
   */
  async waitForLoad() {
    // Wait for network to be idle since it's a client:only component
    await this.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    await this.header.header.waitFor({ state: "visible", timeout: 15000 });
    await this.roomPhotosSection.section.waitFor({ state: "visible", timeout: 10000 });
    await this.inspirationPhotosSection.section.waitFor({ state: "visible", timeout: 10000 });
    await this.requirementsTracker.tracker.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.page
      .getByText("Ładowanie pokoju...")
      .isVisible()
      .catch(() => false);
  }

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.page
      .locator('[role="alert"]')
      .isVisible()
      .catch(() => false);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.locator('[role="alert"]');
    const isVisible = await errorElement.isVisible().catch(() => false);
    if (isVisible) {
      return await errorElement.textContent();
    }
    return null;
  }

  /**
   * Upload a room photo with optional description
   */
  async uploadRoomPhoto(filePath: string, description?: string) {
    await this.roomPhotosSection.uploadPhoto(filePath, description);
    await this.roomPhotosSection.waitForUploadComplete();
  }

  /**
   * Upload an inspiration photo with optional description
   */
  async uploadInspirationPhoto(filePath: string, description?: string) {
    await this.inspirationPhotosSection.uploadPhoto(filePath, description);
    await this.inspirationPhotosSection.waitForUploadComplete();
  }

  /**
   * Get total number of photos across both sections
   */
  async getTotalPhotoCount(): Promise<number> {
    const roomCount = await this.roomPhotosSection.getPhotoCards().count();
    const inspirationCount = await this.inspirationPhotosSection.getPhotoCards().count();
    return roomCount + inspirationCount;
  }
}
