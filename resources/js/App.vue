<template>
  <div>
    <AppHeader class="app-header" menuBreakpoint="xl">
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
import { AppHeader, NavbarItem, AppFooter } from "@umn-latis/cla-vue-template";
import UserLookup from "@/components/UserLookup.vue";
import CreateGroup from "@/components/CreateGroup.vue";
import { $can } from "@/utils";
import { mapStores } from "pinia";
import { useTermsStore } from "./stores/useTermsStore";

export default {
  components: {
    AppHeader,
    AppFooter,
    UserLookup,
    CreateGroup,
    NavbarItem,
  },
  props: ["userperms"],
  data() {
    return {
      findUser: false,
      createGroup: false,
    };
  },
  computed: {
    ...mapStores(useTermsStore),
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
.umn-app-header .navbar-links-container {
  justify-content: space-between;
  width: 100%;
  & .navbar-item:not(:first-child, :last-child) {
    flex: 1;
    display: inline-flex;
    justify-content: center;
  }
}
</style>
