/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

import "./bootstrap";
import Vue from "vue";
import Vuex from "vuex";
import VueRouter from "vue-router";
import VueSelect from "vue-select";
import VueTour from "vue-tour";
import Permissions from "./mixins/permissions";
import VueMoment from "vue-moment";
import VTooltip from "v-tooltip";
import Treeselect from "@riophae/vue-treeselect";
import Autocomplete from "vuejs-auto-complete";
import JsonCSV from "vue-json-csv";
import UserHome from "./components/UserHome.vue";
import LandingPage from "./components/LandingPage.vue";
import UserList from "./components/UserList.vue";
import RoleList from "./components/RoleList.vue";
import Group from "./components/Group.vue";
import Role from "./components/Role.vue";
import GroupList from "./components/GroupList.vue";
import ReportList from "./components/ReportList.vue";
import MissingOfficial from "./components/MissingOfficial.vue";
import LastModified from "./components/LastModified.vue";
import CeddLike from "./components/ceddLike.vue";
import orgp from "./components/orgp.vue";
import Home from "./components/Home.vue";
import ViewUser from "./components/ViewUser.vue";
import ViewGroup from "./components/ViewGroup.vue";
import EditGroup from "./components/EditGroup.vue";
import Members from "./components/Members.vue";
import Roles from "./components/Roles.vue";
import Modal from "./components/Modal.vue";
import UserLookup from "./components/UserLookup.vue";
import CreateGroup from "./components/CreateGroup.vue";
import Gantt from "./components/Gantt.vue";
import GanttRow from "./components/GanttRow.vue";
import MemberList from "./components/MemberList.vue";
import SortableLink from "./components/Sortable.vue";
import Favorites from "./components/Favorites.vue";
import GroupTitle from "./components/GroupTitle.vue";
import FolderWidget from "./components/FolderWidget.vue";
import AppHeader from "./cla-vue-template/src/components/AppHeader.vue";
import NavbarItem from "./cla-vue-template/src/components/NavbarItem.vue";
import AppFooter from "./cla-vue-template/src/components/AppFooter.vue";
import PostIt from "./cla-vue-template/src/components/PostIt.vue";

import "vue-tour/dist/vue-tour.css";

window.Vue = Vue;

Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(VueSelect);
Vue.use(VueTour);
Vue.mixin(Permissions);
Vue.use(VueMoment);
Vue.use(VTooltip);
Vue.use(Treeselect);

Vue.component("v-select", VueSelect);
Vue.component("treeselect", Treeselect);
Vue.component("autocomplete", Autocomplete);
Vue.component("downloadCsv", JsonCSV);
Vue.component("userhome", UserHome);
Vue.component("landingpage", LandingPage);
Vue.component("userlist", UserList);
Vue.component("group", Group);
Vue.component("role", Role);
Vue.component("grouplist", GroupList);
Vue.component("roleList", GroupList);
Vue.component("reportList", ReportList);
Vue.component("missingOfficial", MissingOfficial);
Vue.component("lastModified", LastModified);
Vue.component("ceddLike", CeddLike);
Vue.component("orgp", orgp);
Vue.component("home", Home);
Vue.component("viewuser", ViewUser);
Vue.component("viewgroup", ViewGroup);
Vue.component("editgroup", EditGroup);
Vue.component("members", Members);
Vue.component("roles", Roles);
Vue.component("modal", Modal);
Vue.component("userlookup", UserLookup);
Vue.component("creategroup", CreateGroup);
Vue.component("gantt", Gantt);
Vue.component("gantt-row", GanttRow);
Vue.component("member-list", MemberList);
Vue.component("sortableLink", SortableLink);
Vue.component("favorites", Favorites);
Vue.component("group-title", GroupTitle);
Vue.component("folder-widget", FolderWidget);
Vue.component("app-header", AppHeader);
Vue.component("navbar-item", NavbarItem);
Vue.component("app-footer", AppFooter);
Vue.component("postit", PostIt);

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
        axios
          .delete("/api/user/favorite/" + type + "/" + item.id)
          .then((response) => {
            commit("removeFavorite", payload);
          });
      } else {
        axios
          .post("/api/user/favorite/" + type + "/" + item.id)
          .then((response) => {
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
        (f) => f.id != payload.item.id
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
      component: UserHome,
      props: true,
    },
    {
      name: "userList",
      path: "/userList/",
      component: UserList,
      props: (route) => ({
        users: route.query.users,
        groupId: route.query.groupId,
      }),
    },
    {
      name: "group",
      path: "/group/:groupId/:hash?",
      component: Group,
      props: true,
    },
    { name: "role", path: "/role/:roleId", component: Role, props: true },
    {
      name: "groupList",
      path: "/groups/:parent?",
      component: GroupList,
      props: true,
    },
    { name: "roleList", path: "/roles/", component: RoleList, props: true },
    {
      name: "reportList",
      path: "/reports/",
      component: ReportList,
      props: true,
    },
    {
      name: "missingOfficial",
      path: "/reports/missingOfficialRoles",
      component: MissingOfficial,
      props: true,
    },
    {
      name: "lastModified",
      path: "/reports/lastModified",
      component: LastModified,
      props: true,
    },
    {
      name: "ceddLike",
      path: "/reports/ceddLike",
      component: CeddLike,
      props: true,
    },
    { name: "orgp", path: "/reports/orgp", component: orgp, props: true },
  ],
});

const app = new Vue({
  el: "#app",
  store,
  router,
});
