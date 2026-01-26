import type { Locator, Page } from "@playwright/test";

export class RoomsSectionPage {
  readonly page: Page;
  readonly section: Locator;
  readonly title: Locator;
  readonly loadingState: Locator;
  readonly errorState: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;
  readonly emptyState: Locator;
  readonly emptyStateTitle: Locator;
  readonly createFirstRoomButton: Locator;
  readonly roomsGrid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.section = page.getByTestId("rooms-section");
    this.title = page.getByTestId("rooms-section-title");
    this.loadingState = page.getByTestId("rooms-loading");
    this.errorState = page.getByTestId("rooms-error");
    this.errorMessage = page.getByTestId("rooms-error-message");
    this.retryButton = page.getByTestId("rooms-retry-button");
    this.emptyState = page.getByTestId("rooms-empty-state");
    this.emptyStateTitle = page.getByTestId("rooms-empty-title");
    this.createFirstRoomButton = page.getByTestId("create-first-room-button");
    this.roomsGrid = page.getByTestId("rooms-grid");
  }

  async isLoadingVisible(): Promise<boolean> {
    return await this.loadingState.isVisible();
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorState.isVisible();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? "";
  }

  async clickRetry() {
    await this.retryButton.click();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  async clickCreateFirstRoom() {
    await this.createFirstRoomButton.click();
  }

  async isRoomsGridVisible(): Promise<boolean> {
    return await this.roomsGrid.isVisible();
  }

  async getRoomCardsCount(): Promise<number> {
    return await this.page.getByTestId("room-card").count();
  }
}
