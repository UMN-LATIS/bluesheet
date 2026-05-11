import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import pluginCypress from "eslint-plugin-cypress";

export default tseslint.config(
  {
    ignores: ["public/**", "vendor/**"],
  },
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["resources/js/**/*.{js,ts,vue}"],
    languageOptions: {
      globals: {
        axios: "readonly",
      },
      parserOptions: {
        parser: tseslint.parser,
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "vue/multi-word-component-names": "off",
      "vue/attribute-hyphenation": ["error", "never"],
      "vue/v-on-event-hyphenation": ["error", "never"],
      "vue/component-definition-name-casing": "off",
      "vue/no-reserved-component-names": "off",
      "vue/no-undef-components": [
        "error",
        {
          ignorePatterns: ["router-link", "router-view"],
        },
      ],
      "vue/component-name-in-template-casing": [
        "warn",
        "PascalCase",
        {
          registeredComponentsOnly: false,
          ignores: ["component", "router-link", "router-view"],
        },
      ],
    },
  },
  {
    files: ["**/cypress/**/*.{js,ts}"],
    ...pluginCypress.configs.recommended,
  },
);
