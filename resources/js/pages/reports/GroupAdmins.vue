<template>
  <DefaultLayout>
    <p>
      This report gives you information about BlueSheet Managers (those who can
      manage a given group) and groups without managers.
    </p>

    <table class="table">
      <thead>
        <tr>
          <th>
            <SortableLink
              sortLabel="Name"
              sortElement="name"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th>Admins</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="department in groupsWithAdmins" :key="department.dept_id">
          <td>
            <router-link
              :to="{ name: 'group', params: { groupId: department.id } }"
            >
              {{ department.group_title }}</router-link
            >
          </td>
          <td>
            {{
              department.activeMembers.map((m) => m.user.displayName).join(", ")
            }}
          </td>
        </tr>
      </tbody>
    </table>
    <p>Groups without admins</p>
    <table class="table">
      <thead>
        <tr>
          <th>
            <SortableLink
              sortLabel="Name"
              sortElement="name"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="department in groupsWithoutAdmins" :key="department.dept_id">
          <td>
            <router-link
              :to="{ name: 'group', params: { groupId: department.id } }"
              >{{ department.group_title }}</router-link
            >
          </td>
        </tr>
      </tbody>
    </table>
  </DefaultLayout>
</template>

<script>
import SortableLink from "@/components/SortableLink.vue";
import { dayjs } from "@/utils";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

export default {
  components: {
    SortableLink,
    DefaultLayout,
  },
  data() {
    return {
      currentSort: "dept_id",
      currentSortDir: "asc",
      groupData: [],
    };
  },
  computed: {
    groupsWithAdmins: function () {
      return this.groupData.filter((group) => group.activeMembers.length > 0);
    },
    groupsWithoutAdmins: function () {
      return this.groupData.filter((group) => group.activeMembers.length === 0);
    },
  },
  async mounted() {
    var groupData = await axios.get("/api/group/admins");
    this.groupData = groupData.data;
  },
  methods: {
    dayjs,
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
