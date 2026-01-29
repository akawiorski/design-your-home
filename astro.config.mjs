// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

const adapter = cloudflare();

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias:
        // eslint-disable-next-line no-undef
        process.env.NODE_ENV === "production"
          ? {
              "react-dom/server": "react-dom/server.edge",
            }
          : {},
    },
  },
  adapter: adapter,
  env: {
    schema: {
      SUPABASE_URL: envField.string({
        context: "server",
        access: "secret",
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      ENV_NAME: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      PUBLIC_ENV_NAME: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
});
