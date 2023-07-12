import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    laravel(["resources/assets/js/app.js"]),
    vue({
      template: {
          transformAssetUrls: {
              // The Vue plugin will re-write asset URLs, when referenced
              // in Single File Components, to point to the Laravel web
              // server. Setting this to `null` allows the Laravel plugin
              // to instead re-write asset URLs to point to the Vite
              // server instead.
              base: null,

              // The Vue plugin will parse absolute URLs and treat them
              // as absolute paths to files on disk. Setting this to
              // `false` will leave absolute URLs un-touched so they can
              // reference assets in the public directory as expected.
              includeAbsolute: false,
          },
      },
  }),
  ],
  resolve: {
    alias: {
      "@": "/resources/assets/js",

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
