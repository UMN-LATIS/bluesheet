import { createRouter, createWebHistory } from "vue-router";

// pages
import UserHomePage from "./pages/UserHomePage.vue";
import LandingPage from "./pages/LandingPage.vue";
import UserListPage from "./pages/UserListPage.vue";
import GroupPage from "./pages/GroupPage.vue";
import GroupListPage from "./pages/GroupListPage.vue";
import ReportListPage from "./pages/ReportListPage.vue";
import RoleListPage from "./pages/RoleListPage.vue";
import RolePage from "./pages/RolePage.vue";

// reports
import CeddLikeReportPage from "./pages/reports/CeddLikeReportPage.vue";
import CommitteeServiceReportPage from "./pages/reports/CommitteeServiceReportPage.vue";
import FiscalReportPage from "./pages/reports/FiscalReportPage.vue";
import LastModifiedReportPage from "./pages/reports/LastModifiedReportPage.vue";
import MissingOfficialReportPage from "./pages/reports/MissingOfficialReportPage.vue";
import OrgpReportPage from "./pages/reports/OrgpReportPage.vue";
import SchedulingReportPage from "./pages/reports/SchedulingReportPage.vue";

function parseIntFromParam(
  param: string | string[] | undefined,
): number | null {
  if (typeof param !== "string") {
    return null;
  }

  const n = Number.parseInt(param);
  return Number.isNaN(n) ? null : n;
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { name: "home", path: "/", component: LandingPage },
    {
      name: "user",
      path: "/user/:userId?",
      component: UserHomePage,
      props: (route) => ({
        userId: parseIntFromParam(route.params.userId),
      }),
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
      component: MissingOfficialReportPage,
      props: true,
    },
    {
      name: "lastModified",
      path: "/reports/lastModified",
      component: LastModifiedReportPage,
      props: true,
    },
    {
      name: "ceddLike",
      path: "/reports/ceddLike",
      component: CeddLikeReportPage,
      props: true,
    },
    {
      name: "orgp",
      path: "/reports/orgp",
      component: OrgpReportPage,
      props: true,
    },
    {
      name: "fiscal",
      path: "/reports/fiscal",
      component: FiscalReportPage,
      props: true,
    },
    {
      name: "committeeService",
      path: "/reports/committeeService",
      component: CommitteeServiceReportPage,
      props: true,
    },
    {
      name: "schedulingReport",
      path: "/reports/schedulingReport/:groupId",
      component: SchedulingReportPage,
      props: true,
    },
  ],
});