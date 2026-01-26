import type { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for RoomHeader component
 * Represents the header section of a room page with title, dates, and navigation
 */
export class RoomHeaderPage {
  readonly page: Page;
  readonly header: Locator;
  readonly backToDashboardLink: Locator;
  readonly title: Locator;
  readonly dates: Locator;
  readonly createdDate: Locator;
  readonly updatedDate: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId("room-header");
    this.backToDashboardLink = page.getByTestId("back-to-dashboard-link");
    this.title = page.getByTestId("room-title");
    this.dates = page.getByTestId("room-dates");
    this.createdDate = page.getByTestId("room-created-date");
    this.updatedDate = page.getByTestId("room-updated-date");
  }

  /**
   * Navigate back to dashboard by clicking the link
   */
  async goBackToDashboard() {
    await this.backToDashboardLink.click();
  }

  /**
   * Get the room title text
   */
  async getRoomTitle(): Promise<string> {
    return (await this.title.textContent()) || "";
  }
}
