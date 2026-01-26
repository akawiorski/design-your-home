import type { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for PhotoRequirementsTracker component
 * Represents the requirements tracker showing photo count progress
 */
export class PhotoRequirementsTrackerPage {
  readonly page: Page;
  readonly tracker: Locator;
  readonly title: Locator;
  readonly roomRequirement: Locator;
  readonly roomCount: Locator;
  readonly inspirationRequirement: Locator;
  readonly inspirationCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tracker = page.getByTestId("requirements-tracker");
    this.title = page.getByTestId("requirements-tracker-title");
    this.roomRequirement = page.getByTestId("requirement-room");
    this.roomCount = page.getByTestId("requirement-room-count");
    this.inspirationRequirement = page.getByTestId("requirement-inspiration");
    this.inspirationCount = page.getByTestId("requirement-inspiration-count");
  }

  /**
   * Get room photo count from tracker
   * Returns object with current and required counts
   */
  async getRoomCount(): Promise<{ current: number; required: number }> {
    const text = (await this.roomCount.textContent()) || "";
    const match = text.match(/(\d+)\/(\d+)/);
    if (match) {
      return { current: parseInt(match[1], 10), required: parseInt(match[2], 10) };
    }
    return { current: 0, required: 0 };
  }

  /**
   * Get inspiration photo count from tracker
   * Returns object with current and required counts
   */
  async getInspirationCount(): Promise<{ current: number; required: number }> {
    const text = (await this.inspirationCount.textContent()) || "";
    const match = text.match(/(\d+)\/(\d+)/);
    if (match) {
      return { current: parseInt(match[1], 10), required: parseInt(match[2], 10) };
    }
    return { current: 0, required: 0 };
  }

  /**
   * Check if room requirement is fulfilled (text is not muted)
   */
  async isRoomRequirementFulfilled(): Promise<boolean> {
    const classes = (await this.roomRequirement.getAttribute("class")) || "";
    return classes.includes("text-foreground") && !classes.includes("text-muted-foreground");
  }

  /**
   * Check if inspiration requirement is fulfilled (text is not muted)
   */
  async isInspirationRequirementFulfilled(): Promise<boolean> {
    const classes = (await this.inspirationRequirement.getAttribute("class")) || "";
    return classes.includes("text-foreground") && !classes.includes("text-muted-foreground");
  }

  /**
   * Check if all requirements are fulfilled
   */
  async areAllRequirementsFulfilled(): Promise<boolean> {
    const roomFulfilled = await this.isRoomRequirementFulfilled();
    const inspirationFulfilled = await this.isInspirationRequirementFulfilled();
    return roomFulfilled && inspirationFulfilled;
  }
}
