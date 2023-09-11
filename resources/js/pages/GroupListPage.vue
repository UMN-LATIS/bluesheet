<template>
  <DefaultLayout>
    <div>
      <div class="row">
        <div class="col-10">
          <nav class="breadcrumb">
            <router-link
              v-for="breadcrumb in breadCrumbs"
              :key="breadcrumb.title"
              class="breadcrumb-item"
              :to="{ path: breadcrumb.path }"
              activeClass="active"
              exactActiveClass=""
              exact
              >{{ breadcrumb.title }}</router-link
            >
          </nav>
        </div>
        <div class="col-2 p-1">
          <input
            v-model="searchTerm"
            type="text"
            class="form-control"
            placeholder="Search"
          />
        </div>
      </div>

      <!-- <table class="table" v-if="currentOrganizations.length > 0">
            <thead>
                <tr>
                    <th scope="col">Groups</th>
              </tr>
          </thead>
          <tbody>
                <tr v-for="currentOrg in currentOrganizations" :key="currentOrg.id" >
                <td><router-link :to='{ path: "/groups/" + currentOrg.id }'>{{ currentOrg.label }}</router-link>
                </td>
            </tr>
          </tbody>
         </table> -->

      <table v-if="groupList" class="table">
        <thead>
          <tr>
            <th scope="col">Groups</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(group, key) in mergedSortedList" :key="key">
            <td v-if="group.active_group && !group.parent_group_id">
              <div class="tw-flex tw-gap-2">
                <i class="fas fa-users"></i>
                <router-link
                  :to="{ name: 'group', params: { groupId: group.id } }"
                >
                  <GroupTitle :group="group" />
                </router-link>
              </div>
              <ul v-if="includeSubgroups && group.child_groups.length > 0">
                <li v-for="subgroup in group.child_groups" :key="subgroup.id">
                  <router-link
                    :to="{ name: 'group', params: { groupId: subgroup.id } }"
                    ><GroupTitle :group="subgroup"
                  /></router-link>
                </li>
              </ul>
            </td>
            <td
              v-if="!group.active_group && !group.created_at"
              class="tw-flex tw-gap-2"
            >
              <i class="fas fa-folder"></i>
              <router-link :to="{ path: '/groups/' + group.id }">{{
                group.group_title
              }}</router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="form-group col-md-6">
        <div class="form-check">
          <input
            id="subgroups"
            v-model="includeSubgroups"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label" for="subgroups">
            Include Sub-groups
          </label>
        </div>
      </div>
      <div v-if="!parent" class="form-group col-md-6">
        <div class="form-check">
          <input
            id="allGroups"
            v-model="showAllGroups"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label" for="allGroups">
            Show All Groups
          </label>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import GroupTitle from "@/components/GroupTitle.vue";
import { debounce } from "lodash-es";

export default {
  components: {
    GroupTitle,
    DefaultLayout,
  },
  props: ["parent"],
  data() {
    return {
      groupList: null,
      error: null,
      parentOrganizations: [],
      includeSubgroups: true,
      showAllGroups: false,
      searchTerm: null,
    };
  },
  computed: {
    breadCrumbs: function () {
      if (this.parentOrganizations.length == 0) {
        return [];
      }

      var pathToItem = this.getPathToChild(
        this.parent,
        this.parentOrganizations,
      );

      var cumulativeRoute = [];
      var breadCrumbArray = [{ title: "Groups", path: "/groups/" }];
      for (var item of pathToItem) {
        cumulativeRoute.push(item);

        breadCrumbArray.push({ title: item.label, path: "/groups/" + item.id });
      }
      return breadCrumbArray;
    },
    mergedSortedList: function () {
      var merged = this.groupList.folders.concat(this.groupList.groups);
      merged.sort((a, b) => {
        if (!a.group_title || !b.group_title) {
          return 0;
        }

        return a.group_title.localeCompare(b.group_title);
      });
      return merged;
    },
  },
  watch: {
    searchTerm: function () {
      if (this.searchTerm.length > 0) {
        this.filterListBySearchTerm();
      } else {
        this.loadGroups();
      }
    },
    showAllGroups: function () {
      if (this.showAllGroups) {
        axios.get("/api/group").then((res) => {
          this.groupList.groups = res.data;
          this.groupList.folders = [];
        });
      } else {
        this.loadGroups();
      }
    },
  },
  mounted() {
    this.loadGroups();
  },
  methods: {
    filterListBySearchTerm: function () {
      let debounced = debounce(() => {
        axios
          .post("/api/group/search", { searchTerm: this.searchTerm })
          .then((res) => {
            this.groupList = res.data;
          });
      }, 100);
      debounced();
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
    flatten: function (items) {
      const flat = [];

      items.forEach((item) => {
        if (Array.isArray(item)) {
          flat.push(...this.flatten(item));
        } else {
          flat.push(item);
        }
      });

      return flat;
    },
    getPathToChild: function (targetId, targetGroup) {
      if (!targetId) {
        return [];
      }

      for (var org of targetGroup) {
        if (org.id == targetId) {
          // we've found our target, flatten the rest
          return [org];
        } else if (org.children) {
          // walk the tree to find our target
          var childrenGroups = this.getPathToChild(targetId, org.children);
          if (childrenGroups.length > 0) {
            return this.flatten([org, childrenGroups]);
          }
        }
      }
      return [];
    },

    loadGroups() {
      axios
        .get("/api/folder/" + (this.parent ? this.parent : ""))
        .then((res) => {
          this.groupList = res.data;
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
  },
};
</script>
