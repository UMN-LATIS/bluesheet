import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

// Allow Vitest to run in CI despite laravel-vite-plugin's env check
process.env.LARAVEL_BYPASS_ENV_CHECK = "1";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      include: ["resources/js/**/*.{test,spec}.{js,ts}"],
    },
  }),
);
