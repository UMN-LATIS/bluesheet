import { defineConfig } from "cypress";
import { loadEnv } from "vite";

// Read APP_URL from .env so Cypress targets this checkout's app. Each
// worktree runs on its own APP_PORT, and a hardcoded `http://localhost`
// points at whichever container currently holds port 80.
const { APP_URL } = loadEnv("", process.cwd(), "APP_");

export default defineConfig({
  chromeWebSecurity: false,
  defaultCommandTimeout: 5000,
  watchForFileChanges: true,
  // retries: 2,
  videosFolder: "tests/cypress/videos",
  screenshotsFolder: "tests/cypress/screenshots",
  fixturesFolder: "tests/cypress/fixture",
  video: false,
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    baseUrl: APP_URL ?? "http://localhost",
    specPattern: "tests/cypress/integration/**/*.{test,spec}.[jt]s",
    supportFile: "tests/cypress/support/index.ts",
    experimentalRunAllSpecs: true,
  },
});
