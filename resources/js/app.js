
/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('./bootstrap');

window.Vue = require('vue');


import VueRouter from 'vue-router'
Vue.use(VueRouter)


import VueSelect from 'vue-select';
Vue.component('v-select', VueSelect)
Vue.use(VueSelect);


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

import UserList from './components/UserList.vue';
Vue.component('userlist', UserList);


import Group from './components/Group.vue';
Vue.component('group', Group);

import Role from './components/Role.vue';
Vue.component('role', Role);


import GroupList from './components/GroupList.vue';
Vue.component('grouplist', GroupList);

import RoleList from './components/RoleList.vue';
Vue.component('roleList', GroupList);


Vue.component('home', require('./components/Home.vue').default);
Vue.component('viewuser', require('./components/ViewUser.vue').default);
Vue.component('edituser', require('./components/EditUser.vue').default);
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


/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */


const router = new VueRouter({
    mode: 'history',
  routes: [
    { name: 'home', path: "/", component: UserHome },
    { name: 'user', path: "/user/:userId?", component: UserHome, props:true },
    { name: 'userList', path: "/userList/", component: UserList, props: (route) => ({ users: route.query.users, groupId:route.query.groupId })},
    { name: 'group', path: "/group/:groupId/:hash?", component: Group, props:true },
    { name: 'role', path: "/role/:roleId", component: Role, props:true },
    { name: 'groupList', path: "/groups/", component: GroupList, props:true },
    { name: 'roleList', path: "/roles/", component: RoleList, props:true },
  ]
})


const app = new Vue({
    el: '#app',
    router
});
