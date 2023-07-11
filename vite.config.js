import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import vue from "@vitejs/plugin-vue2";

export default defineConfig({
  plugins: [
    laravel(["resources/assets/js/app.js"]),
    vue({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2,
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/resources/assets/js",

      // temporarily use vue 2 compat build to support vue 3
      vue: "@vue/compat",

      // use vue's runtime compiler to support vue components
      // directly within blade templates
      // vue: "vue/dist/vue.esm-bundler.js",
    },
  },
  // TODO: Remove this when we've migrated MIX variables to VITE
  // WARNING: DO NOT SET TO "" OR [] OR IT WILL EXPOSE ALL ENV VARS
  // just remove the line if you don't need it
  envPrefix: ["VITE_", "MIX_"],
});
