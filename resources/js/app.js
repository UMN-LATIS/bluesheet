
/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

import './bootstrap';

import Vue from 'vue'

window.Vue = Vue;

import Vuex from 'vuex'
Vue.use(Vuex)

import VueRouter from 'vue-router'
Vue.use(VueRouter)


import VueSelect from 'vue-select';
Vue.component('v-select', VueSelect)
Vue.use(VueSelect);


import VueTour from 'vue-tour'
import 'vue-tour/dist/vue-tour.css'
Vue.use(VueTour)


import Permissions from './mixins/permissions';
Vue.mixin(Permissions);

import VueMoment from 'vue-moment';
Vue.use(VueMoment);

import VTooltip from 'v-tooltip'
Vue.use(VTooltip);

import Treeselect from '@riophae/vue-treeselect'
Vue.component('treeselect', Treeselect)
Vue.use(Treeselect);

import Autocomplete from 'vuejs-auto-complete'
Vue.component('autocomplete', Autocomplete);

import JsonCSV from 'vue-json-csv'
Vue.component('downloadCsv', JsonCSV);


// const files = require.context('./', true, /\.vue$/i)
// files.keys().map(key => Vue.component(key.split('/').pop().split('.')[0], files(key)))
import UserHome from './components/UserHome.vue';
Vue.component('userhome', UserHome);

import LandingPage from './components/LandingPage.vue';
Vue.component('landingpage', LandingPage);


import UserList from './components/UserList.vue';
Vue.component('userlist', UserList);


import Group from './components/Group.vue';
Vue.component('group', Group);

import Role from './components/Role.vue';
Vue.component('role', Role);


import GroupList from './components/GroupList.vue';
Vue.component('grouplist', GroupList);

import RoleList from './components/RoleList.vue';
import Axios from 'axios';
Vue.component('roleList', GroupList);


import ReportList from './components/ReportList.vue';
Vue.component('reportList', ReportList);

import MissingOfficial from './components/MissingOfficial.vue';
Vue.component('missingOfficial', MissingOfficial);

import LastModified from './components/LastModified.vue';
Vue.component('lastModified', LastModified);

import CeddLike from './components/ceddLike.vue';
Vue.component('ceddLike', CeddLike);


Vue.component('home', require('./components/Home.vue').default);
Vue.component('viewuser', require('./components/ViewUser.vue').default);
Vue.component('viewgroup', require('./components/ViewGroup.vue').default);
Vue.component('editgroup', require('./components/EditGroup.vue').default);
Vue.component('members', require('./components/Members.vue').default);
Vue.component('roles', require('./components/Roles.vue').default);
Vue.component('modal', require('./components/Modal.vue').default);
Vue.component('userlookup', require('./components/UserLookup.vue').default);
Vue.component('creategroup', require('./components/CreateGroup.vue').default);
Vue.component('gantt', require('./components/Gantt.vue').default);
Vue.component('gantt-row', require('./components/GanttRow.vue').default);
Vue.component('member-list', require('./components/MemberList.vue').default);
Vue.component('sortableLink', require('./components/Sortable.vue').default);
Vue.component('favorites', require('./components/Favorites.vue').default);
Vue.component('group-title', require('./components/GroupTitle.vue').default);
Vue.component('folder-widget', require('./components/FolderWidget.vue').default);

import VueCompositionAPI from "@vue/composition-api";
Vue.use(VueCompositionAPI);

Vue.component('app-header', require('./cla-vue-template/src/components/AppHeader.vue').default);
Vue.component('navbar-item', require('./cla-vue-template/src/components/NavbarItem.vue').default);
Vue.component('app-footer', require('./cla-vue-template/src/components/AppFooter.vue').default);
Vue.component('postit', require('./cla-vue-template/src/components/PostIt.vue').default);

const store = new Vuex.Store({
  state: {
    favorites: {
      groups: [],
      roles: []
    },
    user: null
  },
  actions: {
    toggleFavorite({commit, state}, payload) {
      var type = payload.type;
      var item = payload.item;
      if (state.favorites[type].filter(f => f.id == item.id).length > 0) {
        axios.delete('/api/user/favorite/' + type + '/' + item.id)
        .then(response => {
          commit('removeFavorite', payload);
        });
      }
      else {
        axios.post('/api/user/favorite/' + type + '/' + item.id)
            .then(response => {
                commit('addFavorite', payload);
            });
      }
    },
    fetchUser(context) {
      axios.get("/api/user/show")
      .then(response => {
        context.commit('setUser', response.data);
        context.commit('setFavorites', {type: "groups", content: response.data.favoriteGroups});
        context.commit('setFavorites', {
                    type: "roles",
                    content: response.data.favoriteRoles});
      });
    }
  },
  mutations: {
    addFavorite(state, payload) {
      state.favorites[payload.type].push(payload.item);
    },
    removeFavorite(state, payload) {
      state.favorites[payload.type] = state.favorites[payload.type].filter(f => f.id != payload.item.id);
    },
    setFavorites(state, payload) {
      state.favorites[payload.type] = payload.content;
    },
    setUser(state, payload) {
      state.user = payload
    }
  }
});



/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */


const router = new VueRouter({
    mode: 'history',
  routes: [
    { name: 'home', path: "/", component: LandingPage },
    { name: 'user', path: "/user/:userId?", component: UserHome, props:true },
    { name: 'userList', path: "/userList/", component: UserList, props: (route) => ({ users: route.query.users, groupId:route.query.groupId })},
    { name: 'group', path: "/group/:groupId/:hash?", component: Group, props:true },
    { name: 'role', path: "/role/:roleId", component: Role, props:true },
    { name: 'groupList', path: "/groups/:parent?", component: GroupList, props:true },
    { name: 'roleList', path: "/roles/", component: RoleList, props:true },
    { name: 'reportList', path: "/reports/", component: ReportList, props:true },
    { name: 'missingOfficial', path: "/reports/missingOfficialRoles", component: MissingOfficial, props:true },
    { name: 'lastModified', path: "/reports/lastModified", component: LastModified, props:true },
    { name: 'ceddLike', path: "/reports/ceddLike", component: CeddLike, props:true },
  ]
})


const app = new Vue({
    el: '#app',
    store,
    router
});
