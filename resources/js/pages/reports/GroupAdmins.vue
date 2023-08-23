<template>
  <div>
    <p>
      This report gives you information about BlueSheet group admins (those who can manage a given group) and groups without admins.
    </p>
    <pre>

</pre>

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
          <th>
            Admins
              
          </th>
         
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="department in groupsWithAdmins"
          :key="department.dept_id"
        >
          <td>
            <router-link :to="{ name: 'group', params: { groupId: department.id } }">
            {{ department.group_title }}</router-link></td>
          <td>{{ department.activeMembers.map(m => m.user.displayName).join(", ") }}</td>
        
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
        <tr
          v-for="department in groupsWithoutAdmins"
          :key="department.dept_id"
        >
          <td><router-link :to="{ name: 'group', params: { groupId: department.id } }">{{ department.group_title }}</router-link></td>
         
        
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import UserWithLink from "@/components/UserWithLink.vue";
import SortableLink from "@/components/SortableLink.vue";
import { dayjs } from "@/lib";

export default {
  components: {
    UserWithLink,
    SortableLink,
  },
  data() {
    return {
      currentSort: "dept_id",
      currentSortDir: "asc",
      groupData: []
    };
  },
  computed: {
    groupsWithAdmins: function() {
        return this.groupData.filter(group => group.activeMembers.length > 0);
    },
    groupsWithoutAdmins: function() {
        return this.groupData.filter(group => group.activeMembers.length === 0);
    },

    sortedListByDepartment: function () {
    //   return [...this.listByDepartment].sort((a, b) => {
    //     let modifier = 1;
    //     if (this.currentSortDir === "desc") modifier = -1;

    //     a = a?.[this.currentSort] || " ";
    //     b = b?.[this.currentSort] || " ";

    //     if (typeof a === "string") {
    //       a = a.toLowerCase();
    //     } else {
    //       if (a[0] && a[0].user && a[0].user.displayName) {
    //         a = a[0].user.displayName.toLowerCase();
    //       }
    //     }

    //     if (typeof b === "string") {
    //       b = b.toLowerCase();
    //     } else {
    //       if (b[0] && b[0].user && b[0].user.displayName) {
    //         b = b[0].user.displayName.toLowerCase();
    //       }
    //     }

    //     if (a < b) return -1 * modifier;
    //     if (a > b) return 1 * modifier;
    //     return 0;
    //   });
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
