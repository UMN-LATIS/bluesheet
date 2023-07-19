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
        <td>{{ favorite.updated_at ? dayjs(favorite.updated_at).format("YYYY, MMM Do") : '' }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import SortableLink from "./SortableLink.vue";
import { dayjs } from "@/lib";

export default {
  components: {
    SortableLink,
  },
  // we use newly loaded user, not state
  props: ["user", "type"],
  data() {
    return {
      currentSortDir: "desc",
      currentSort: "updated_at",
    };
  },
  computed: {
    titleItem: function () {
      if (this.type == "group") {
        return "group_title";
      }
      if (this.type == "role") {
        return "label";
      }
      throw new Error(
        `Cannot compute titleItem in Favorites: Unknown type: ${this.type}`,
      );
    },
    sortedList: function () {
      let sortItem = [];
      if (this.type == "group") {
        sortItem = this.$store.state.favorites.groups;
      }
      if (this.type == "role") {
        sortItem = this.$store.state.favorites.roles;
      }
      return sortItem.sort(
        function (a, b) {
          let modifier = 1;
          if (this.currentSortDir === "desc") modifier = -1;

          const aCurrentSort = a?.[this.currentSort] || " ";
          const bCurrentSort = b?.[this.currentSort] || " ";

          if (aCurrentSort < bCurrentSort) return -1 * modifier;
          if (aCurrentSort > bCurrentSort) return 1 * modifier;
          return 0;
        }.bind(this),
      );
    },
  },
  methods: {
    dayjs,
    routeLink: function (favorite) {
      if (this.type == "group") {
        return { name: "group", params: { groupId: favorite.id } };
      }
      if (this.type == "role") {
        return { name: "role", params: { roleId: favorite.id } };
      }
    },
    sort: function (s) {
      //if s == current sort, reverse
      if (s === this.currentSort) {
        this.currentSortDir = this.currentSortDir === "asc" ? "desc" : "asc";
      } else {
        this.currentSortDir = "asc";
      }
      this.currentSort = s;
    },
  },
};
</script>
