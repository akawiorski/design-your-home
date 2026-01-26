import type { Locator, Page } from "@playwright/test";
import type { PhotoType } from "@/types";

/**
 * Page Object Model for PhotosSection component
 * Represents a section for uploading and displaying photos (room or inspiration)
 */
export class PhotosSectionPage {
  readonly page: Page;
  readonly photoType: PhotoType;
  readonly section: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly countLabel: Locator;
  readonly limitLabel: Locator;
  readonly descriptionInput: Locator;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly limitMessage: Locator;

  constructor(page: Page, photoType: PhotoType) {
    this.page = page;
    this.photoType = photoType;
    this.section = page.getByTestId(`photos-section-${photoType}`);
    this.title = page.getByTestId(`photos-section-${photoType}-title`);
    this.description = page.getByTestId(`photos-section-${photoType}-description`);
    this.countLabel = page.getByTestId(`photos-section-${photoType}-count`);
    this.limitLabel = page.getByTestId(`photos-section-${photoType}-limit`);
    this.descriptionInput = page.getByTestId(`photo-description-input-${photoType}`);
    this.fileInput = page.getByTestId(`photo-file-input-${photoType}`);
    this.uploadButton = page.getByTestId(`upload-photo-button-${photoType}`);
    this.limitMessage = page.getByTestId(`photos-limit-message-${photoType}`);
  }

  /**
   * Upload a photo with optional description
   * @param filePath - Path to the file to upload
   * @param description - Optional description for the photo
   */
  async uploadPhoto(filePath: string, description?: string) {
    if (description) {
      await this.descriptionInput.fill(description);
    }

    // Set files on the hidden input
    await this.fileInput.setInputFiles(filePath);

    // Wait for upload to complete (button should not be disabled)
    await this.uploadButton.waitFor({ state: "visible" });
  }

  /**
   * Get the current photo count from the label
   * Returns an object with current and required counts
   */
  async getPhotoCount(): Promise<{ current: number; required: number }> {
    const text = (await this.countLabel.textContent()) || "";
    // Expected format: "room: 1/1" or "inspiration: 2/2"
    const match = text.match(/(\d+)\/(\d+)/);
    if (match) {
      return { current: parseInt(match[1], 10), required: parseInt(match[2], 10) };
    }
    return { current: 0, required: 0 };
  }

  /**
   * Get all photo cards in this section
   */
  getPhotoCards() {
    return this.section.getByTestId("photo-card");
  }

  /**
   * Check if upload button is enabled
   */
  async isUploadEnabled(): Promise<boolean> {
    return await this.uploadButton.isEnabled();
  }

  /**
   * Wait for upload completion (button returns to normal state)
   */
  async waitForUploadComplete() {
    await this.page.waitForTimeout(500); // Small delay for UI update
    await this.uploadButton.waitFor({ state: "visible" });
    const buttonText = await this.uploadButton.textContent();
    // Wait until button no longer shows "Wysyłanie..."
    if (buttonText?.includes("Wysyłanie")) {
      await this.page.waitForFunction(
        (selector) => {
          const button = document.querySelector(`[data-testid="${selector}"]`);
          return button?.textContent?.includes("Dodaj zdjęcie");
        },
        `upload-photo-button-${this.photoType}`,
        { timeout: 10000 }
      );
    }
  }
}
