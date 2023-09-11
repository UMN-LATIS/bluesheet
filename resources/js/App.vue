<template>
  <div>
    <AppHeader class="app-header">
      <template #app-link>
        <router-link :to="{ name: 'home' }">BlueSheet</router-link>
      </template>
      <template #navbar-links>
        <NavbarItem>
          <router-link :to="{ name: 'home' }">Home</router-link>
        </NavbarItem>
        <NavbarItem>
          <router-link :to="{ name: 'user' }" class="nav-link"
            >My Groups <i class="fas fa-user"></i>
          </router-link>
        </NavbarItem>
        <NavbarItem v-if="$can('create groups')">
          <a class="nav-link" href="#" @click.prevent="createGroup = true"
            >Create Group <i class="fas fa-plus"></i
          ></a>
        </NavbarItem>
        <NavbarItem v-if="$can('view groups')">
          <router-link :to="{ name: 'groupList' }" class="nav-link"
            >Browse Groups <i class="fas fa-search"></i
          ></router-link>
        </NavbarItem>
        <NavbarItem v-if="$can('view groups')">
          <router-link :to="{ name: 'roleList' }" class="nav-link"
            >Browse Roles <i class="fas fa-search"></i
          ></router-link>
        </NavbarItem>
        <NavbarItem v-if="$can('view reports')">
          <router-link :to="{ name: 'reportList' }" class="nav-link"
            >View Reports <i class="fas fa-table"></i
          ></router-link>
        </NavbarItem>
        <NavbarItem v-if="$can('view users')">
          <a class="nav-link" href="#" @click.prevent="findUser = true"
            >User Lookup <i class="fas fa-users"></i
          ></a>
        </NavbarItem>
        <NavbarItem>
          <a
            class="nav-link"
            href="https://umn-latis.github.io/bluesheet/"
            target="_blank"
            >Help <i class="fas fa-question-circle"></i
          ></a>
        </NavbarItem>
        <NavbarItem>
          <a href="/shibboleth-logout" class="nav-link">Logout</a>
        </NavbarItem>
      </template>
    </AppHeader>

    <router-view :key="$route.fullPath" :userperms="userperms" />

    <AppFooter />

    <UserLookup v-if="findUser" :show="findUser" @close="findUser = false" />
    <CreateGroup
      v-if="createGroup"
      :show="createGroup"
      @close="createGroup = false"
    />
  </div>
</template>

<script>
import {
  AppHeader,
  NavbarItem,
  AppFooter,
  PostIt,
} from "@umn-latis/cla-vue-template";
import UserLookup from "./components/UserLookup.vue";
import CreateGroup from "./components/CreateGroup.vue";
import { $can } from "./lib";

export default {
  components: {
    AppHeader,
    AppFooter,
    UserLookup,
    CreateGroup,
    NavbarItem,
    PostIt,
  },
  props: ["userperms"],
  data() {
    return {
      findUser: false,
      createGroup: false,
    };
  },
  mounted() {
    this.$store.dispatch("fetchUser");
    console.log("Component mounted.");
  },
  methods: {
    $can,
  },
};
</script>

<style>
/* .container {
        margin-top: 10px;
    } */

.navbar-block .router-link-exact-active {
  color: black !important;
}

.fas {
  margin-left: 5px;
  margin-top: 3px;
}
</style>
<style scoped>
.post-it {
  position: relative;
  z-index: 1;
  margin-bottom: 2rem;
}
</style>
<style lang="scss">
/**
* these are some fixes for the app header navbar-links slot until
* cla-vue-templates is updated
**/
.app-header {
  // the navbar should take up all available space
  // the second ul is for the right navbar links slot
  // which is empty
  ul:first-child {
    flex: 1;
  }

  // first and last should only take up the space they need
  // so that they appear left and right aligned
  .navbar-item:is(:first-child, :last-child) {
    flex: 0;
  }

  // center the text within the flex container
  // this is for the middle navbar items where the container
  // is larger than the text
  .navbar-item a {
    justify-content: center;
  }
}
</style>
