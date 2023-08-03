<template>
  <div>
    <h3>Leaves</h3>
    <div
      v-if="$can('edit leaves')"
      class="btn btn-primary"
      @click="edit = !edit"
    >
      Edit
    </div>
    <ViewLeaves v-if="!edit" :leaves="leaves"></ViewLeaves>
    <EditLeaves v-if="edit" :leaves="leaves"></EditLeaves>
  </div>
</template>

<script lang="ts">
import ViewLeaves from "@/components/ViewLeaves.vue";
import EditLeaves from "@/components/EditLeaves.vue";
import { $can } from "@/lib";

export default {
  components: {
    ViewLeaves,
    EditLeaves,
  },
  props: ["leaves"],
  data() {
    return {
      edit: false,
    };
  },
  methods: {
    $can,
  },
};
</script>
