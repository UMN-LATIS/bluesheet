module.exports = {
  globals: {
    axios: true,
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended",
    "prettier",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    parser: "@typescript-eslint/parser",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "vue"],
  ignorePatterns: ["resources/js/cla-vue-template"],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "vue/multi-word-component-names": "off",
    "vue/attribute-hyphenation": ["error", "never"],
    "vue/v-on-event-hyphenation": ["error", "never"],
    "vue/component-definition-name-casing": "off",
    "vue/no-undef-components": [
      "error",
      {
        ignorePatterns: ["router-link", "router-view", "v-tour"],
      },
    ],
    "vue/component-name-in-template-casing": [
      "warn",
      "PascalCase",
      {
        registeredComponentsOnly: false,
        ignores: ["component", "router-link", "router-view", "v-tour"],
      },
    ],
  },
  overrides: [
    // cypress should only be linted in cypress/
    {
      files: ["**/cypress/**/*.js"],
      extends: ["plugin:cypress/recommended"],
    },
    // this keeps jest from linting cypress files
    {
      files: ["**/resources/assets/js/**/*.js"],
      extends: ["plugin:jest/recommended", "plugin:jest/style"],
    },
  ],
};
