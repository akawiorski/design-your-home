import type { Page } from "@playwright/test";
import { DashboardHeaderPage } from "./dashboard-header.page";
import { RoomsSectionPage } from "./rooms-section.page";
import { CreateRoomDialogPage } from "./create-room-dialog.page";
import { RoomCardPage } from "./room-card.page";

/**
 * Main Dashboard Page Object that composes all dashboard components
 */
export class DashboardPage {
  readonly page: Page;
  readonly header: DashboardHeaderPage;
  readonly roomsSection: RoomsSectionPage;
  readonly createRoomDialog: CreateRoomDialogPage;

  constructor(page: Page) {
    this.page = page;
    this.header = new DashboardHeaderPage(page);
    this.roomsSection = new RoomsSectionPage(page);
    this.createRoomDialog = new CreateRoomDialogPage(page);
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async waitForLoad() {
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Get a specific room card by index
   */
  getRoomCard(index = 0): RoomCardPage {
    return new RoomCardPage(this.page, index);
  }

  /**
   * Get a specific room card by room ID
   */
  getRoomCardById(roomId: string): RoomCardPage {
    return RoomCardPage.getByRoomId(this.page, roomId);
  }

  /**
   * Open create room dialog from header
   */
  async openCreateRoomDialogFromHeader() {
    await this.header.clickCreateRoom();
    await this.createRoomDialog.waitForDialogToOpen();
  }

  /**
   * Open create room dialog from empty state
   */
  async openCreateRoomDialogFromEmptyState() {
    await this.roomsSection.clickCreateFirstRoom();
    await this.createRoomDialog.waitForDialogToOpen();
  }

  /**
   * Complete flow: create a new room
   */
  async createNewRoom(roomType: string) {
    await this.openCreateRoomDialogFromHeader();
    await this.createRoomDialog.createRoom(roomType);
    // Wait for navigation to room details
    await this.page.waitForURL(/\/rooms\/\d+/);
  }

  /**
   * Check if dashboard is in loading state
   */
  async isLoading(): Promise<boolean> {
    return await this.roomsSection.isLoadingVisible();
  }

  /**
   * Check if dashboard shows empty state
   */
  async isEmptyState(): Promise<boolean> {
    return await this.roomsSection.isEmptyStateVisible();
  }

  /**
   * Check if dashboard shows error state
   */
  async isErrorState(): Promise<boolean> {
    return await this.roomsSection.isErrorVisible();
  }

  /**
   * Check if dashboard shows rooms grid
   */
  async hasRooms(): Promise<boolean> {
    return await this.roomsSection.isRoomsGridVisible();
  }

  /**
   * Get count of displayed room cards
   */
  async getRoomsCount(): Promise<number> {
    return await this.roomsSection.getRoomCardsCount();
  }
}
