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
            href="https://umn-latis.github.io/Caligari/"
            target="_blank"
            >Help <i class="fas fa-question-circle"></i
          ></a>
        </NavbarItem>
        <NavbarItem>
          <a href="/shibboleth-logout" class="nav-link">Logout</a>
        </NavbarItem>
      </template>
    </AppHeader>

    <PostIt class="container post-it">
      <router-view :key="$route.fullPath" :userperms="userperms"></router-view>
    </PostIt>

    <AppFooter />

    <UserLookup v-if="findUser" :show="findUser" @close="findUser = false" />
    <CreateGroup
      v-if="createGroup"
      :show="createGroup"
      @close="createGroup = false"
    />
    <v-tour name="intro_tour" :steps="steps"></v-tour>
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
      steps: [
        {
          target: "#v-step-0", // We're using document.querySelector() under the hood
          header: {
            title: "Welcome to the BlueSheet Tool",
          },
          content: `Discover the <strong>BlueSheet Tool</strong> with this quick tour. <br/> We'll show you the basics, and you can always reach out for assistance.`,
        },
        {
          target: "#v-step-1",
          content: `Right now, you're on the home page. This gives you quick access to some common needs.`,
        },
        {
          target: "#v-step-4",
          content: `The BlueSheet Tool is used to keep track of the membership of groups, committees, and departments. This includes both the people involved and their roles. If someone has two roles within a group, they'll have two entries in the list.`,
        },
        {
          target: "#pastRoles",
          content:
            "One of the powerful features of the BlueSheet Tool is that it keeps track of any previous group memberships as well. As you use the tool, this checkbox will let you view historical data.",
        },
        {
          target: "#v-step-6",
          content: `You can browse all of the available groups using this tab. Groups are organized into folders, but you'll also be able to search for a specific group. You can favorite groups that you use often, and they'll apear on your "My Groups" page.`,
        },
        {
          target: "#v-step-7",
          content: `The "Browse Roles" tab allows you to see all of the people who hold a given role. This can be useful for answering questions like "Who are all the Directors of Undergraduate Studies".`,
        },
        {
          target: "#v-step-8",
          content: `If you've got any questions, the "Help" tab has guides, frequently asked questions, and an intro video. You can also contact us if you've got any questions.`,
        },
      ],
    };
  },
  mounted() {
    this.$store.dispatch("fetchUser");
    console.log("Component mounted.");
    if (window.showTour) {
      this.$tours["intro_tour"].start();
    }
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

