import { RouteRecordRaw } from "vue-router";
import CoursePlanningPage from "./CoursePlanningPage.vue";
import { parseIntFromRouteParam } from "@/utils";

export const coursePlanningRoutes: RouteRecordRaw[] = [
  {
    path: "groups/:groupId",
    component: CoursePlanningPage,
    props: (route) => ({
      groupId: parseIntFromRouteParam(route.params.groupId),
    }),
  },
];
