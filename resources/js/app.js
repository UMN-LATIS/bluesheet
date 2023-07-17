/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

import "./bootstrap";

import { createApp } from "vue";
import VTooltip from "v-tooltip";
import VueTour from "vue3-tour";
import { store } from "./store";
import { router } from "./router";
import App from "./App.vue";

// Global CSS
import "@umn-latis/cla-vue-template/dist/style.css";
import "vue3-tour/dist/vue3-tour.css";
import "../sass/app.scss";

createApp(App).use(store).use(router).use(VTooltip).use(VueTour).mount("#app");
