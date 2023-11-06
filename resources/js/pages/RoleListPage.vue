<template>
  <DefaultLayout>
    <table
      v-for="officialGroupType in officialGroupTypes"
      :key="officialGroupType"
      class="table"
    >
      <thead>
        <tr>
          <th scope="col">Official {{ officialGroupType }} Roles</th>
        </tr>
      </thead>
      <tbody v-if="roleList">
        <tr
          v-for="(role, key) in roleList.filter(
            (r) =>
              r.official_group_type &&
              r.official_group_type
                .map((gt) => gt.label)
                .includes(officialGroupType),
          )"
          :key="key"
        >
          <td>
            <router-link :to="{ name: 'role', params: { roleId: role.id } }">{{
              role.label
            }}</router-link>
          </td>
        </tr>
      </tbody>
    </table>
    <table class="table">
      <thead>
        <tr>
          <th scope="col">Unofficial Roles</th>
        </tr>
      </thead>
      <tbody v-if="roleList">
        <tr
          v-for="(role, key) in roleList.filter((r) => !r.official_group_type)"
          :key="key"
        >
          <td>
            <router-link :to="{ name: 'role', params: { roleId: role.id } }">{{
              role.label
            }}</router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </DefaultLayout>
</template>

<script>
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { usePageTitle } from "@/utils/usePageTitle";

export default {
  components: { DefaultLayout },
  data() {
    return {
      roleList: [],
      error: null,
    };
  },
  computed: {
    officialGroupTypes: function () {
      let allLabels = this.roleList
        .map((r) => r.official_group_type)
        .flat()
        .filter((r) => r)
        .map((r) => (r ? r.label : false));
      return [...new Set(allLabels)];
    },
  },
  mounted() {
    usePageTitle("Roles");
    this.loadRoles();
  },
  methods: {
    loadRoles() {
      axios
        .get("/api/group/roles")
        .then((res) => {
          this.roleList = res.data;
        })
        .catch((err) => {
          this.error = err.response.data;
        });
    },
  },
};
</script>
