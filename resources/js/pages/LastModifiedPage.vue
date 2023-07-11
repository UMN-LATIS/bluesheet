<template>
  <div>
    <div v-if="parentOrganizations" class="form-group row">
      <label for="parentOrganization" class="col-sm-2 col-form-label"
        >Filter by Folder</label
      >
      <div class="col-sm-6">
        <TreeSelect
          v-model="parentOrganization"
          :multiple="false"
          :options="parentOrganizations"
          :clearable="false"
          :searchable="true"
          :openOnClick="true"
          :closeOnSelect="true"
          label="parent_folder"
        />
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>
            <SortableLink
              sortLabel="Group"
              sortElement="group_title"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th>
            <SortableLink
              sortLabel="Last Modified"
              sortElement="lastModified"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="group in sortedList" :key="group.id">
          <td>
            <router-link :to="{ name: 'group', params: { groupId: group.id } }">
              <GroupTitle :group="group" />
            </router-link>
          </td>
          <td>{{ group.lastModified | moment("YYYY, MMM Do") }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import TreeSelect from "@riophae/vue-treeselect";
import SortableLink from "../components/SortableLink.vue";
import GroupTitle from "../components/GroupTitle.vue";

export default {
  components: {
    TreeSelect,
    SortableLink,
    GroupTitle,
  },
  data() {
    return {
      currentSortDir: "desc",
      currentSort: "lastModified",
      groupList: [],
      parent: null,
      parentOrganization: null,
      parentOrganizations: [],
    };
  },
  computed: {
    sortedList: function () {
      return [...this.groupList]
        .sort(
          function (a, b) {
            let modifier = 1;
            if (this.currentSortDir === "desc") modifier = -1;

            const aCurrentSort = window._.get(a, this.currentSort) || " ";
            const bCurrentSort = window._.get(b, this.currentSort) || " ";

            if (aCurrentSort.toLowerCase() < bCurrentSort.toLowerCase())
              return -1 * modifier;
            if (aCurrentSort.toLowerCase() > bCurrentSort.toLowerCase())
              return 1 * modifier;
            return 0;
          }.bind(this),
        )
        .filter((g) => {
          return (
            !this.parentOrganization ||
            (this.parentOrganization &&
              this.selectedParentAndChildren.includes(g.parent_organization_id))
          );
        });
    },
    selectedParentAndChildren: function () {
      var branch = null;
      this.parentOrganizations.forEach((parentOrg) => {
        if (this.recursiveHuntForOrg(this.parentOrganization, parentOrg)) {
          branch = this.recursiveHuntForOrg(this.parentOrganization, parentOrg);
        }
      });
      let flattened = this.flattenBranch(branch);
      return flattened.flat();
    },
  },
  mounted() {
    axios.get("/api/group/").then((res) => {
      this.groupList = res.data.map((g) => {
        let modifiedArray = g.active_members.map((m) => {
          return m.updated_at;
        });

        if (modifiedArray && modifiedArray.length > 0) {
          g.lastModified = modifiedArray.reduce((a, b) => {
            return a > b ? a : b;
          });
        } else {
          g.lastModified = null;
        }

        return g;
      });
    });
    axios
      .get("/api/group/parents")
      .then((res) => {
        this.parentOrganizations = this.remapParents(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  },
  methods: {
    recursiveHuntForOrg: function (targetOrg, branch) {
      if (branch.id == targetOrg) {
        return branch;
      } else if (branch.children) {
        for (const child of branch.children) {
          let result = this.recursiveHuntForOrg(targetOrg, child);
          if (result) {
            return result;
          }
        }
      }
      return false;
    },
    flattenBranch: function (branch) {
      var resultArray = [];
      resultArray.push(branch.id);
      console.log(branch);
      if (branch.children) {
        branch.children.forEach((child) => {
          resultArray.push(this.flattenBranch(child));
        });
      }

      return resultArray;
    },
    remapParents: function (p) {
      return p.map((org) => {
        var result = { id: org.id, label: org.group_title };
        if (org.child_organizations_recursive.length > 0) {
          result.children = this.remapParents(
            org.child_organizations_recursive,
          );
        }
        return result;
      });
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
