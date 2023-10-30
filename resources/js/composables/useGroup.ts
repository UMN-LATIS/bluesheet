import { ref } from "vue";
import * as api from "@/api";
import type { Group } from "@/types";

export const useGroup = (groupId: number) => {
  const group = ref<Group | null>(null);

  api.getGroup(groupId).then((g) => {
    group.value = g;
  });

  return group;
};
