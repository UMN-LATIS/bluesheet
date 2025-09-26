/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "jsdom",
  testMatch: [
    "**/resources/js/**/__tests__/**/*.?(m)[jt]s?(x)",
    "**/resources/js/**/?(*.)+(spec|test).?(m)[tj]s?(x)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/vendor/"],
  preset: "ts-jest/presets/js-with-ts-esm",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/resources/js/$1",
    "^lodash-es$": "lodash",
  },
  prettierPath: require.resolve("prettier-2"),
};
