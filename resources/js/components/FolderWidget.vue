<template>
  <SimpleNestedSelect
    v-if="parentOrganizations"
    :modelValue="modelValue"
    :options="parentOrganizations"
    @update:modelValue="(val) => $emit('update:modelValue', val)"
  />
</template>

<script>
import SimpleNestedSelect from "./SimpleNestedSelect.vue";
export default {
  components: {
    SimpleNestedSelect,
  },
  props: ["modelValue"],
  emits: ["update:modelValue"],
  data() {
    return {
      parentOrganizations: [],
    };
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
