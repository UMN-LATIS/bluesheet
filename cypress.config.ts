import { defineConfig } from "cypress";

export default defineConfig({
  chromeWebSecurity: false,
  defaultCommandTimeout: 5000,
  watchForFileChanges: true,
  videosFolder: "tests/cypress/videos",
  screenshotsFolder: "tests/cypress/screenshots",
  fixturesFolder: "tests/cypress/fixture",
  video: false,
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    baseUrl: "http://localhost",
    specPattern: "tests/cypress/integration/**/*.{test,spec}.[jt]s",
    supportFile: "tests/cypress/support/index.ts",
    experimentalRunAllSpecs: true,
  },
});
