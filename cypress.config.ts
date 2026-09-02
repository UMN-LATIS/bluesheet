import { defineConfig } from "cypress";
import { loadEnv } from "vite";

// Each worktree's app runs on its own port, so read APP_URL from .env.
// Mode "" makes Vite read only .env and .env.local, not .env.<mode>.
const { APP_URL } = loadEnv("", process.cwd(), "APP_");

if (!APP_URL) {
  throw new Error("Cypress needs APP_URL in .env to know which app to test.");
}

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
    baseUrl: APP_URL,
    specPattern: "tests/cypress/integration/**/*.{test,spec}.[jt]s",
    supportFile: "tests/cypress/support/index.ts",
    experimentalRunAllSpecs: true,
  },
});
