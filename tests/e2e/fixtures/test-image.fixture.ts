import { test as base } from "@playwright/test";
import * as path from "path";

/**
 * Test fixture providing a sample test image
 */
export const test = base.extend<{ testImagePath: string }>({
  testImagePath: async ({}, use) => {
    // Path to test image fixture
    const imagePath = path.join(__dirname, "../fixtures/test-image.jpg");
    await use(imagePath);
  },
});

export { expect } from "@playwright/test";
