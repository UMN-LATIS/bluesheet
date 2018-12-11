
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
Vue.use(VueSelect);


// const files = require.context('./', true, /\.vue$/i)
// files.keys().map(key => Vue.component(key.split('/').pop().split('.')[0], files(key)))
import UserHome from './components/UserHome.vue';
Vue.component('userhome', UserHome);
Vue.component('home', require('./components/Home.vue'));

/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */


const router = new VueRouter({
    mode: 'history',
  routes: [
    { path: "/", component: UserHome },
    // { path: "/chime/:chimeId", name:'chime', component: Chime, props: true },
    // { path: "/chimeStudent/:chimeId", name:'chimeStudent', component: ChimeStudent, props: true },
    // { path: "/chime/:chimeId/folder/:folderId/present/:questionId?", name:'present', component: Present, props: true }
    // { path: '/:id?', name: "present", component: require('./components/Present.vue')}
  ]
})


const app = new Vue({
    el: '#app',
    router
});
