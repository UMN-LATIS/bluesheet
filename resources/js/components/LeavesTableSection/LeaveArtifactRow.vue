<template>
  <tr>
    <td></td>
    <template v-if="isEditing || isNewArtifact">
      <td colspan="3">
        <InputGroup
          v-model="localArtifact.label"
          label="Label"
          placeholder="Artifact Label"
          :showLabel="false"
        />
      </td>
      <td colspan="2">
        <InputGroup
          v-model="localArtifact.target"
          label="URL"
          :showLabel="false"
          placeholder="Artifact URL"
        />
      </td>
      <td>
        <div class="tw-flex tw-gap-1 tw-px-2 tw-justify-end tw-items-center">
          <SmallButton @click="handleCancelEdit">Cancel</SmallButton>
          <SmallButton variant="primary" @click="handleSave">
            Save
          </SmallButton>
        </div>
      </td>
    </template>
    <template v-else>
      <td colspan="5">
        <a
          :href="localArtifact.target"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {{ localArtifact.label }}
        </a>
      </td>
      <td>
        <div class="tw-flex tw-gap-1 tw-px-2 tw-justify-end tw-items-center">
          <SmallButton @click="isEditing = true">Edit</SmallButton>
          <SmallButton variant="danger" @click="handleDelete"
            >Delete</SmallButton
          >
        </div>
      </td>
    </template>
  </tr>
</template>
<script setup lang="ts">
import { Leave, LeaveArtifact } from "@/types";
import { ref, computed, watch } from "vue";
import { isTempId } from "@/utils";
import InputGroup from "@/components/InputGroup.vue";
import SmallButton from "./SmallButton.vue";
import * as api from "@/api";
import { cloneDeep } from "lodash";

const props = defineProps<{
  leave: Leave;
  artifact: LeaveArtifact;
}>();

const emit = defineEmits<{
  (eventName: "update", value: LeaveArtifact);
  (eventName: "delete", value: LeaveArtifact);
}>();

const localArtifact = ref<LeaveArtifact>(cloneDeep(props.artifact));
const isEditing = ref(false);
const isNewArtifact = computed(() => isTempId(localArtifact.value.id));

watch(
  () => props.artifact,
  (artifact) => {
    localArtifact.value = cloneDeep(artifact);
  },
  { immediate: true },
);

function handleCancelEdit() {
  if (isNewArtifact.value) {
    emit("delete", localArtifact.value);
    return;
  }

  // reset the local artifact to the original
  localArtifact.value = cloneDeep(props.artifact);
  isEditing.value = false;
}

async function handleSave() {
  const artifact = isNewArtifact.value
    ? await api.createLeaveArtifact(localArtifact.value)
    : await api.updateLeaveArtifact(localArtifact.value);

  isEditing.value = false;
  localArtifact.value = artifact;
  return emit("update", artifact);
}

async function handleDelete() {
  if (isNewArtifact.value) {
    emit("delete", localArtifact.value);
    return;
  }

  await api.deleteLeaveArtifact(localArtifact.value);
  return emit("delete", localArtifact.value);
}
</script>
<style scoped>
td {
  padding: 0.25rem 0.5rem;
}
</style>
