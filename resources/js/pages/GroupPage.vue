<template>
  <DefaultLayout>
    <div>
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>
      <ViewGroup
        v-if="!editing && group"
        v-model:isEditing="editing"
        :group="group"
      />
      <EditGroup
        v-if="editing && group"
        v-model:editing="editing"
        :group="group"
        @update:reload="groupStore.fetchGroup(props.groupId)"
      />
    </div>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import ViewGroup from "@/components/ViewGroup.vue";
import EditGroup from "@/components/EditGroup.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { usePageTitle } from "@/utils/usePageTitle";
import { Group } from "@/types";
import { computed, ref, watch } from "vue";
import { useGroupStore } from "@/stores/useGroupStore";

const props = defineProps<{
  groupId: Group["id"];
  hash: string | null;
}>();

const groupStore = useGroupStore();
const group = computed(() => groupStore.groupLookup[props.groupId]);
const error = ref<string | null>(null);
const editing = ref(false);

watch(
  () => props.groupId,
  () => {
    groupStore.fetchGroup(props.groupId);
  },
  { immediate: true },
);

watch(
  group,
  () => {
    usePageTitle(group.value?.group_title || "");
  },
  { immediate: true },
);
</script>
