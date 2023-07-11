/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

import "./bootstrap";

import Vue from "vue";
import Vuex from "vuex";
import VueRouter from "vue-router";
import VTooltip from "v-tooltip";
import App from "./App.vue";
import VueTour from "vue-tour";

// pages
import UserHomePage from "./pages/UserHomePage.vue";
import LandingPage from "./pages/LandingPage.vue";
import UserListPage from "./pages/UserListPage.vue";
import GroupPage from "./pages/GroupPage.vue";
import GroupListPage from "./pages/GroupListPage.vue";
import ReportListPage from "./pages/ReportListPage.vue";
import MissingOfficialPage from "./pages/MissingOfficialPage.vue";
import LastModifiedPage from "./pages/LastModifiedPage.vue";
import CeddLikePage from "./pages/CeddLikePage.vue";
import OrgpPage from "./pages/OrgpPage.vue";
import RoleListPage from "./pages/RoleListPage.vue";
import RolePage from "./pages/RolePage.vue";

// Global CSS
import "@umn-latis/cla-vue-template/dist/style.css";
import "vue-tour/dist/vue-tour.css";
import "../sass/app.scss";

window.Vue = Vue;

Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(VTooltip);
Vue.use(VueTour);
Vue.component("app", App);

const store = new Vuex.Store({
  state: {
    favorites: {
      groups: [],
      roles: [],
    },
    user: null,
  },
  actions: {
    toggleFavorite({ commit, state }, payload) {
      var type = payload.type;
      var item = payload.item;
      if (state.favorites[type].filter((f) => f.id == item.id).length > 0) {
        axios.delete("/api/user/favorite/" + type + "/" + item.id).then(() => {
          commit("removeFavorite", payload);
        });
      } else {
        axios.post("/api/user/favorite/" + type + "/" + item.id).then(() => {
          commit("addFavorite", payload);
        });
      }
    },
    fetchUser(context) {
      axios.get("/api/user/show").then((response) => {
        context.commit("setUser", response.data);
        context.commit("setFavorites", {
          type: "groups",
          content: response.data.favoriteGroups,
        });
        context.commit("setFavorites", {
          type: "roles",
          content: response.data.favoriteRoles,
        });
      });
    },
  },
  mutations: {
    addFavorite(state, payload) {
      state.favorites[payload.type].push(payload.item);
    },
    removeFavorite(state, payload) {
      state.favorites[payload.type] = state.favorites[payload.type].filter(
        (f) => f.id != payload.item.id,
      );
    },
    setFavorites(state, payload) {
      state.favorites[payload.type] = payload.content;
    },
    setUser(state, payload) {
      state.user = payload;
    },
  },
});

/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */

const router = new VueRouter({
  mode: "history",
  routes: [
    { name: "home", path: "/", component: LandingPage },
    {
      name: "user",
      path: "/user/:userId?",
      component: UserHomePage,
      props: true,
    },
    {
      name: "userList",
      path: "/userList/",
      component: UserListPage,
      props: (route) => ({
        users: route.query.users,
        groupId: route.query.groupId,
      }),
    },
    {
      name: "group",
      path: "/group/:groupId/:hash?",
      component: GroupPage,
      props: true,
    },
    { name: "role", path: "/role/:roleId", component: RolePage, props: true },
    {
      name: "groupList",
      path: "/groups/:parent?",
      component: GroupListPage,
      props: true,
    },
    { name: "roleList", path: "/roles/", component: RoleListPage, props: true },
    {
      name: "reportList",
      path: "/reports/",
      component: ReportListPage,
      props: true,
    },
    {
      name: "missingOfficial",
      path: "/reports/missingOfficialRoles",
      component: MissingOfficialPage,
      props: true,
    },
    {
      name: "lastModified",
      path: "/reports/lastModified",
      component: LastModifiedPage,
      props: true,
    },
    {
      name: "ceddLike",
      path: "/reports/ceddLike",
      component: CeddLikePage,
      props: true,
    },
    { name: "orgp", path: "/reports/orgp", component: OrgpPage, props: true },
  ],
});

new Vue({
  el: "#app",
  store,
  router,
  render: (h) => h(App),
});
