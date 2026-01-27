import { DatabaseHelper } from "./helpers/database.helper";

/**
 * Global setup - runs once before all tests
 * Prepares the test environment and validates configuration
 */
async function globalSetup() {
  const testUserId = process.env.E2E_USERNAME_ID;
  const testUsername = process.env.E2E_USERNAME;
  const testPassword = process.env.E2E_PASSWORD;

  if (!testUserId || !testUsername || !testPassword) {
    const isCI = Boolean(process.env.CI);
    const sourceHint = isCI ? "environment variables" : ".env.test or environment variables";

    throw new Error(
      `Missing required environment variables: E2E_USERNAME_ID, E2E_USERNAME, E2E_PASSWORD must be set in ${sourceHint}`
    );
  }

  try {
    console.log("[Global Setup] Validating test environment...");

    // Clean up any leftover data from previous test runs
    await DatabaseHelper.deleteAllRoomsForUser(testUserId);

    // Verify database connection by fetching room types
    const roomTypes = await DatabaseHelper.getRoomTypes();
    if (!roomTypes || roomTypes.length === 0) {
      throw new Error("No room types found in database - database may not be properly initialized");
    }

    console.log("[Global Setup] Test environment ready");
    console.log(`[Global Setup] Found ${roomTypes.length} room types`);
    console.log(`[Global Setup] Test user: ${testUsername}`);
  } catch (error) {
    console.error("[Global Setup] Failed to prepare test environment:", error);
    throw error;
  }
}

export default globalSetup;
