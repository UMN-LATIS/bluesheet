<template>
  <div>
    <div class="row">
      <div class="col-md-12">
        <div
          class="btn-group float-right"
          role="group"
          aria-label="Edit Controls"
        >
          <button
            class="btn btn-outline-primary"
            @click="
              $store.dispatch('toggleFavorite', { type: 'groups', item: group })
            "
          >
            <i
              class="fa-star"
              :class="{ fas: groupFavorited, far: !groupFavorited }"
            ></i>
            Favorite
          </button>
          <button
            v-if="$can('edit groups') || group.user_can_edit"
            class="btn btn-outline-primary"
            @click="$emit('update:editing', true)"
          >
            Edit Group
          </button>
        </div>
        <h1><GroupTitle :group="group" /></h1>
        <ul class="groupInfo">
          <li v-if="group.parent_organization && $can('view groups')">
            Folder:
            <strong
              ><router-link
                :to="{
                  name: 'groupList',
                  params: { parent: group.parent_organization.id },
                }"
                >{{ group.parent_organization.group_title }}</router-link
              ></strong
            >
          </li>
          <li v-if="group.parent_group && $can('view groups')">
            Parent Group:
            <strong
              ><router-link
                :to="{
                  name: 'group',
                  params: { groupId: group.parent_group.id },
                }"
                >{{ group.parent_group.group_title }}</router-link
              ></strong
            >
          </li>
          <li v-if="group.group_type">
            Group Type: <strong>{{ group.group_type.label }}</strong>
          </li>
          <li v-if="group.google_group">
            Google Group: <strong>{{ group.google_group }}</strong>
          </li>
          <li v-if="group.dept_id">
            Department ID: <strong>{{ group.dept_id }}</strong>
          </li>
          <li v-if="group.private_group"><strong>Private Group</strong></li>
          <li>{{ group.notes }}</li>
          <li
            v-if="
              group.child_groups.filter((e) => e.active_group).length > 0 &&
              $can('view groups')
            "
          >
            Sub Groups:
            <ul v-if="group.child_groups">
              <li
                v-for="child_group in group.child_groups.filter(
                  (e) => e.active_group,
                )"
                :key="child_group.id"
              >
                <router-link
                  :to="{ name: 'group', params: { groupId: child_group.id } }"
                  >{{ child_group.group_title }}</router-link
                >
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <ul>
      <li v-for="(artifact, index) in group.artifacts" :key="index">
        <a :href="artifact.target">{{ artifact.label }}</a>
      </li>
    </ul>

    <Members
      :groupType="group.group_type.label"
      :members="group.members"
      :group="group"
      :editing="false"
      :show_unit="group.show_unit"
      :roles="filteredRoles"
      viewType="group"
      :downloadTitle="group.group_title"
    ></Members>

    <router-link
      v-if="$can('view groups')"
      :to="{ name: 'userList', query: { groupId: group.id } }"
      class="btn btn-outline-secondary"
      >View membership counts</router-link
    >
  </div>
</template>

<script>
import GroupTitle from "./GroupTitle.vue";
import Members from "./Members.vue";
import { $can } from "../lib";

export default {
  components: {
    GroupTitle,
    Members,
  },
  props: ["group", "editing"],
  emits: ["update:editing"],
  data() {
    return {
      roles: [],
    };
  },
  computed: {
    groupFavorited: function () {
      if (this.$store.state.favorites["groups"]) {
        return (
          this.$store.state.favorites["groups"].filter(
            (g) => g.id == this.group.id,
          ).length > 0
        );
      }
      return false;
    },
    filteredRoles: function () {
      if (!this.roles) {
        return [];
      }
      return this.roles.filter(
        (r) =>
          !r.official_group_type ||
          r.official_group_type
            .map((gt) => gt.label)
            .includes(this.group.group_type.label),
      );
    },
  },
  mounted() {
    axios
      .get("/api/group/roles/")
      .then((res) => {
        this.roles = res.data;
      })
      .catch((err) => {
        this.error = err.response.data;
      });
  },
  methods: {
    $can,
  },
};
</script>

<style scoped></style>

<style scoped>
.row {
  margin-top: 10px;
  margin-bottom: 10px;
}

.groupInfo {
  list-style: none;
}
</style>
