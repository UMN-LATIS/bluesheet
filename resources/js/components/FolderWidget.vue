<template>
  <SimpleNestedSelect
    v-if="parentOrganizations"
    v-model="parentOrganization"
    :options="parentOrganizations"
  />
</template>

<script>
import SimpleNestedSelect from "./SimpleNestedSelect.vue";
export default {
  components: {
    SimpleNestedSelect,
  },
  props: ["value"],
  emits: ["input"],
  data() {
    return {
      parentOrganizations: [],
    };
  },
  computed: {
    parentOrganizationValue: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
  },
  mounted: function () {
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
        var result = {
          id: org.id,
          label: org.group_title,
        };
        if (org.child_organizations_recursive.length > 0) {
          result.children = this.remapParents(
            org.child_organizations_recursive,
          );
          result.children.sort((a, b) => (a.label < b.label ? -1 : 1));
        }
        return result;
      });
    },
  },
};
</script>

<style></style>
