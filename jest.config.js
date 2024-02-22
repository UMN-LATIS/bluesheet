/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  testEnvironment: "jsdom",
  testMatch: [
    "**/resources/js/**/__tests__/**/*.?(m)[jt]s?(x)",
    "**/resources/js/**/?(*.)+(spec|test).?(m)[tj]s?(x)",
  ],
  preset: "ts-jest/presets/js-with-ts-esm",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/resources/js/$1",
    "^lodash-es$": "lodash",
  },
};
