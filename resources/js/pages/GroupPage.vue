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

<script lang="ts">
import ViewGroup from "@/components/ViewGroup.vue";
import EditGroup from "@/components/EditGroup.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { usePageTitle } from "@/utils/usePageTitle";
import { Group } from "@/types";
import { axios } from "@/utils";
import { PropType } from "vue";

export default {
  components: {
    ViewGroup,
    EditGroup,
    DefaultLayout,
  },
  props: {
    groupId: {
      type: Number,
      required: true,
    },
    hash: {
      type: Object as PropType<string | null>,
      default: null,
    },
  },
  data() {
    return {
      error: null as string | null,
      group: null as Group | null,
      editing: false,
    };
  },
  watch: {
    group() {
      usePageTitle(this.group?.group_title || "Group");
    },
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
