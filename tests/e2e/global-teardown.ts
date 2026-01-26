import { DatabaseHelper } from "./helpers/database.helper";

/**
 * Global teardown - runs once after all tests
 * Cleans up test data from the database
 */
async function globalTeardown() {
  const testUserId = process.env.E2E_USERNAME_ID;

  if (!testUserId) {
    console.warn("[Global Teardown] E2E_USERNAME_ID not set, skipping cleanup");
    return;
  }

  try {
    console.log("[Global Teardown] Cleaning up test data...");

    // Delete all rooms (cascade will delete photos)
    await DatabaseHelper.deleteAllRoomsForUser(testUserId);

    console.log("[Global Teardown] Test data cleanup completed successfully");
  } catch (error) {
    console.error("[Global Teardown] Failed to cleanup test data:", error);
    // Don't throw - teardown failures shouldn't fail the test suite
  }
}

export default globalTeardown;
