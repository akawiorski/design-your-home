import type { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for PhotoCard component
 * Represents a single photo card in the grid
 */
export class PhotoCardPage {
  readonly page: Page;
  readonly card: Locator;
  readonly image: Locator;
  readonly date: Locator;
  readonly description: Locator;

  constructor(card: Locator) {
    this.card = card;
    this.page = card.page();
    this.image = card.getByTestId("photo-card-image");
    this.date = card.getByTestId("photo-card-date");
    this.description = card.getByTestId("photo-card-description");
  }

  /**
   * Get photo card by its ID attribute
   */
  static getByPhotoId(page: Page, photoId: string): PhotoCardPage {
    const card = page.locator(`[data-testid="photo-card"][data-photo-id="${photoId}"]`);
    return new PhotoCardPage(card);
  }

  /**
   * Get the photo date text
   */
  async getDate(): Promise<string> {
    return (await this.date.textContent()) || "";
  }

  /**
   * Get the photo description if it exists
   */
  async getDescription(): Promise<string | null> {
    const isVisible = await this.description.isVisible().catch(() => false);
    if (isVisible) {
      return await this.description.textContent();
    }
    return null;
  }

  /**
   * Check if description is visible
   */
  async hasDescription(): Promise<boolean> {
    return await this.description.isVisible().catch(() => false);
  }

  /**
   * Get image source URL
   */
  async getImageUrl(): Promise<string> {
    return (await this.image.getAttribute("src")) || "";
  }
}
