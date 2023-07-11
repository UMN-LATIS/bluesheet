<template>
  <div>
    <div class="alert alert-danger" role="alert" v-if="error">
      {{ error }}
    </div>
    <ViewGroup
      :group="group"
      v-if="!editing && group"
      v-bind:editing.sync="editing"
    />
    <EditGroup
      :group="group"
      v-if="editing && group"
      v-bind:editing.sync="editing"
      v-on:update:reload="loadGroup()"
    />
  </div>
</template>

<script>
import Vue from "vue";
import ViewGroup from "../components/ViewGroup.vue";
import EditGroup from "../components/EditGroup.vue";

export default {
  props: ["groupId", "hash"],
  components: {
    ViewGroup,
    EditGroup,
  },
  data() {
    return {
      error: null,
      group: null,
      editing: false,
    };
  },
  mounted() {
    this.loadGroup();
  },
  methods: {
    loadGroup() {
      this.error = null;
      axios
        .get("/api/group/" + this.groupId + (this.hash ? "/" + this.hash : ""))
        .then((res) => {
          this.group = res.data;
          Vue.set(this.group, "members", []);
          this.group.members = [];
          axios
            .get(
              "/api/group/" +
                this.groupId +
                "/members" +
                (this.hash ? "/" + this.hash : ""),
            )
            .then((res) => {
              Vue.set(this.group, "members", res.data);
            })
            .catch((err) => {
              this.error = err.response.data;
            });
        })
        .catch((err) => {
          this.error = err.response.data;
        });
    },
  },
};
</script>
