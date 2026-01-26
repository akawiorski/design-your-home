import type { Locator, Page } from "@playwright/test";

export class CreateRoomDialogPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly loadingState: Locator;
  readonly roomTypeSelect: Locator;
  readonly errorMessage: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("create-room-dialog");
    this.title = page.getByTestId("create-room-dialog-title");
    this.loadingState = page.getByTestId("room-types-loading");
    this.roomTypeSelect = page.getByTestId("room-type-select");
    this.errorMessage = page.getByTestId("create-room-error");
    this.cancelButton = page.getByTestId("create-room-cancel-button");
    this.submitButton = page.getByTestId("create-room-submit-button");
  }

  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  async isLoadingTypesVisible(): Promise<boolean> {
    return await this.loadingState.isVisible();
  }

  async selectRoomType(roomType: string) {
    await this.roomTypeSelect.selectOption({ label: roomType });
  }

  async selectRoomTypeByValue(value: string) {
    await this.roomTypeSelect.selectOption(value);
  }

  async getSelectedRoomType(): Promise<string> {
    return await this.roomTypeSelect.inputValue();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  async isCancelButtonDisabled(): Promise<boolean> {
    return await this.cancelButton.isDisabled();
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? "";
  }

  async isSubmitButtonLoading(): Promise<boolean> {
    const ariaAttribute = await this.submitButton.getAttribute("aria-busy");
    return ariaAttribute === "true";
  }

  async waitForDialogToClose() {
    await this.dialog.waitFor({ state: "hidden" });
  }

  async waitForDialogToOpen() {
    await this.dialog.waitFor({ state: "visible" });
  }

  /**
   * Complete flow: select room type and submit
   */
  async createRoom(roomType: string) {
    await this.waitForDialogToOpen();
    await this.selectRoomType(roomType);
    await this.clickSubmit();
  }

  /**
   * Close dialog using cancel button
   */
  async closeDialog() {
    await this.clickCancel();
    await this.waitForDialogToClose();
  }

  /**
   * Close dialog using ESC key
   */
  async closeDialogWithEscape() {
    await this.page.keyboard.press("Escape");
    await this.waitForDialogToClose();
  }
}
