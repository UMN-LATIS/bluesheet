<template>
  <DefaultLayout>
    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    <button
      class="btn btn-outline-primary float-right"
      @click="$store.dispatch('toggleFavorite', { type: 'roles', item: role })"
    >
      <i
        class="fa-star"
        :class="{ fas: roleFavorited, far: !roleFavorited }"
      ></i>
      Favorite
    </button>
    <h1>{{ role.label }}</h1>
    <div v-if="parentOrganizations" class="form-group row">
      <label for="parentOrganization" class="col-sm-2 col-form-label"
        >Filter by Folder</label
      >
      <div class="col-sm-6">
        <SimpleNestedSelect
          v-model="parentOrganization"
          :options="parentOrganizations"
          :isNullable="true"
        />
      </div>
    </div>
    <Members
      :members="filteredMembers"
      :editing="false"
      :roles="[role]"
      :show_unit="false"
      :filterList="null"
      groupType="department"
      viewType="role"
      :downloadTitle="role.label"
    />
  </DefaultLayout>
</template>

<script lang="ts">
import Members from "@/components/Members.vue";
import SimpleNestedSelect from "@/components/SimpleNestedSelect.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { axios } from "@/utils";
import { usePageTitle } from "@/utils/usePageTitle";

export default {
  components: {
    Members,
    SimpleNestedSelect,
    DefaultLayout,
  },
  props: {
    roleId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      error: null,
      role: { label: "", members: [] },
      editing: false,
      parentOrganization: null,
      parentOrganizations: null,
    };
  },
  computed: {
    filteredMembers: function () {
      if (!this.parentOrganization) {
        return this.role.members;
      } else {
        let targetLeaf = this.findLeaf(
          this.parentOrganizations[0],
          this.parentOrganization,
        );
        let targetOrganizations = this.recursivePluckId(targetLeaf);
        return this.role.members.filter((m) =>
          targetOrganizations.includes(m.group.parent_organization_id),
        );
      }
    },
    roleFavorited: function () {
      if (this.$store.state.favorites["roles"]) {
        return (
          this.$store.state.favorites["roles"].filter(
            (g) => g.id == this.role.id,
          ).length > 0
        );
      }
      return false;
    },
  },
  watch: {
    role() {
      usePageTitle(this.role?.label || "Role");
    },
  },
  mounted() {
    axios
      .get("/api/role/" + this.roleId)
      .then((res) => {
        this.role = res.data;
      })
      .catch((err) => {
        this.error = err.response.data;
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
    findLeaf: function (element, id) {
      if (element.id == id) {
        return element;
      } else {
        if (element.children) {
          for (const child of element.children) {
            element = this.findLeaf(child, id);
            if (element) {
              return element;
            }
          }
        }
      }
      return false;
    },
    recursivePluckId: function (organization) {
      var returnArray = [];
      if (organization.id) {
        if (organization.children) {
          for (let child of organization.children) {
            returnArray.push(this.recursivePluckId(child));
          }
        }

        returnArray.push(organization.id);
      }
      return returnArray.flat();
    },
  },
};
</script>
