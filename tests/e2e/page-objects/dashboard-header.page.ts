import type { Locator, Page } from "@playwright/test";

export class DashboardHeaderPage {
  readonly page: Page;
  readonly header: Locator;
  readonly title: Locator;
  readonly createRoomButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId("dashboard-header");
    this.title = page.getByTestId("dashboard-title");
    this.createRoomButton = page.getByTestId("create-room-button");
  }

  async clickCreateRoom() {
    await this.createRoomButton.click();
  }

  async isCreateRoomButtonDisabled(): Promise<boolean> {
    return await this.createRoomButton.isDisabled();
  }

  async isVisible(): Promise<boolean> {
    return await this.header.isVisible();
  }

  async getTitleText(): Promise<string> {
    return (await this.title.textContent()) ?? "";
  }
}
