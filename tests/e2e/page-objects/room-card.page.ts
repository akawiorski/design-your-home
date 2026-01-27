import type { Locator, Page } from "@playwright/test";

export class RoomCardPage {
  readonly page: Page;
  card: Locator;
  title: Locator;

  constructor(page: Page, index = 0) {
    this.page = page;
    this.card = page.getByTestId("room-card").nth(index);
    this.title = this.card.getByTestId("room-card-title");
  }

  /**
   * Get a specific room card by room ID
   */
  static getByRoomId(page: Page, roomId: string): RoomCardPage {
    const card = page.locator(`[data-testid="room-card"][data-room-id="${roomId}"]`);
    const instance = new RoomCardPage(page);
    instance.card = card;
    instance.title = card.getByTestId("room-card-title");
    return instance;
  }

  async click() {
    await this.card.click();
  }

  async hover() {
    await this.card.hover();
  }

  async getTitleText(): Promise<string> {
    return (await this.title.textContent()) ?? "";
  }

  async getHref(): Promise<string> {
    return (await this.card.getAttribute("href")) ?? "";
  }

  async isVisible(): Promise<boolean> {
    return await this.card.isVisible();
  }

  async waitForNavigation() {
    await Promise.all([this.page.waitForURL(/\/rooms\/[a-f0-9-]+/), this.card.click()]);
  }
}
