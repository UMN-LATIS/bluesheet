<template>
  <table v-if="user" class="table">
    <thead>
      <tr>
        <th>
          <SortableLink
            :sortLabel="type"
            :sortElement="titleItem"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
            @sort="sort"
          />
        </th>
        <th v-if="type == 'group'" width="30%">
          <SortableLink
            sortLabel="Updated"
            sortElement="updated_at"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
            @sort="sort"
          />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="favorite in sortedList" :key="favorite.id">
        <td>
          <router-link :to="routeLink(favorite)"
            >{{ favorite[titleItem] }}
          </router-link>
        </td>
        <td>
          {{
            favorite.updated_at
              ? dayjs(favorite.updated_at).format("YYYY, MMM Do")
              : ""
          }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import SortableLink from "./SortableLink.vue";
import { dayjs } from "@/utils";
import { Group, MemberRole, User } from "@/types";
import { RouteLocationRaw } from "vue-router";

const props = defineProps<{
  type: "group" | "role";
  user: User;
}>();

const currentSortDir = ref<"desc" | "asc">("desc");
const currentSort = ref("updated_at");

const titleItem = computed(() => {
  if (props.type == "group") {
    return "group_title";
  }
  if (props.type == "role") {
    return "label";
  }
  throw new Error(
    `Cannot compute titleItem in Favorites: Unknown type: ${props.type}`,
  );
});

const sortedList = computed(() => {
  let sortItem = [] as (Group | MemberRole)[];
  if (props.type == "group") {
    sortItem = props.user.favoriteGroups;
  }
  if (props.type == "role") {
    sortItem = props.user.favoriteRoles;
  }
  return sortItem.sort((a, b) => {
    let modifier = 1;
    if (currentSortDir.value === "desc") modifier = -1;

    const aCurrentSort = a?.[currentSort.value] || " ";
    const bCurrentSort = b?.[currentSort.value] || " ";

    if (aCurrentSort < bCurrentSort) return -1 * modifier;
    if (aCurrentSort > bCurrentSort) return 1 * modifier;
    return 0;
  });
});

function routeLink(favorite): RouteLocationRaw {
  if (props.type == "group") {
    return { name: "group", params: { groupId: favorite.id } };
  }
  if (props.type == "role") {
    return { name: "role", params: { roleId: favorite.id } };
  }

  throw new Error(
    `Cannot compute routeLink in Favorites: Unknown type: ${props.type}`,
  );
}

function sort(s) {
  //if s == current sort, reverse
  if (s === currentSort.value) {
    currentSortDir.value = currentSortDir.value === "asc" ? "desc" : "asc";
  } else {
    currentSortDir.value = "asc";
  }
  currentSort.value = s;
}
</script>
