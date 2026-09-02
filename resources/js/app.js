/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

import "./bootstrap";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin } from "@tanstack/vue-query";
import VTooltip from "v-tooltip";
import { router } from "./router";
import App from "./App.vue";

// Global CSS
import "@umn-latis/cla-vue-template/dist/index.css";
import "../sass/app.scss";
import "../sass/tokens.css";
import "../sass/utils.css";

const pinia = createPinia();

const app = createApp(App)
  .use(pinia)
  .use(router)
  .use(VTooltip)
  .use(VueQueryPlugin);

app.mount("#app");
