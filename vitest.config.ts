import { defineConfig } from "vitest/config";
import react from "@astrojs/react";
import { configDefaults } from "vitest/config";
import path from "path";

// export default defineConfig({
//   resolve: {
//     alias: {
//       "@": fileURLToPath(new URL("./src", import.meta.url)),
//     },
//   },
//   test: {
//     environment: "jsdom",
//     setupFiles: ["./src/test/setup.ts"],
//     include: ["src/**/*.test.{ts,tsx}"],
//     exclude: ["tests/e2e/**"],
//   },
// });

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
