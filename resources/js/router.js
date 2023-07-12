import { createRouter, createWebHistory } from "vue-router";

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

export const router = createRouter({
  history: createWebHistory(),
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
