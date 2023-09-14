<template>
  <DefaultLayout>
    <div>
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>
      <ViewGroup
        v-if="!editing && group"
        v-model:editing="editing"
        :group="group"
      />
      <EditGroup
        v-if="editing && group"
        v-model:editing="editing"
        :group="group"
        @update:reload="loadGroup()"
      />
    </div>
  </DefaultLayout>
</template>

<script>
import ViewGroup from "@/components/ViewGroup.vue";
import EditGroup from "@/components/EditGroup.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

export default {
  components: {
    ViewGroup,
    EditGroup,
    DefaultLayout,
  },
  props: ["groupId", "hash"],
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
          // commenting this out, because it seems like we're returning the full membership as part of the group already
          // not totally convinced i'm not missing something though.
          // this.group.members = [];
          // axios
          //   .get(
          //     "/api/group/" +
          //       this.groupId +
          //       "/members" +
          //       (this.hash ? "/" + this.hash : ""),
          //   )
          //   .then((res) => {
          //     this.group.members = res.data;
          //   })
          //   .catch((err) => {
          //     this.error = err.response.data;
          //   });
        })
        .catch((err) => {
          this.error = err.response.data;
        });
    },
  },
};
</script>
