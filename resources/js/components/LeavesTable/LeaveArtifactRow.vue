<template>
  <tr data-cy="leaveArtifactRow">
    <Td></Td>
    <template v-if="$can('edit leaves') && (isEditing || isNewArtifact)">
      <Td colspan="3">
        <InputGroup
          v-model="localArtifact.label"
          label="Label"
          placeholder="Artifact Label"
          :showLabel="false"
          data-cy="artifactLabelInput"
        />
      </Td>
      <Td colspan="2">
        <InputGroup
          v-model="localArtifact.target"
          label="URL"
          :showLabel="false"
          placeholder="Artifact URL"
          data-cy="artifactTargetInput"
        />
      </Td>
      <Td>
        <div class="tw-flex tw-gap-1 tw-px-2 tw-justify-end tw-items-center">
          <SmallButton data-cy="artifactCancelButton" @click="handleCancelEdit"
            >Cancel</SmallButton
          >
          <SmallButton
            variant="primary"
            data-cy="artifactSaveButton"
            @click="handleSave"
          >
            Save
          </SmallButton>
        </div>
      </Td>
    </template>
    <template v-else>
      <Td colspan="3" class="tw-text-sm">
        <a
          :href="localArtifact.target"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {{ localArtifact.label }}
        </a>
      </Td>
      <Td class="tw-text-sm">
        {{ dayjs(localArtifact.created_at).format("MMM D, YYYY") }}
      </Td>
      <Td class="tw-text-sm">
        {{ dayjs(localArtifact.updated_at).format("MMM D, YYYY") }}
      </Td>
      <Td v-if="$can('edit leaves')">
        <div class="tw-flex tw-gap-1 tw-px-2 tw-justify-end tw-items-center">
          <SmallButton data-cy="artifactEditButton" @click="isEditing = true"
            >Edit</SmallButton
          >
          <SmallButton
            variant="danger"
            data-cy="artifactDeleteButton"
            @click="handleDelete"
            >Delete</SmallButton
          >
        </div>
      </Td>
    </template>
  </tr>
</template>
<script setup lang="ts">
import { Leave, LeaveArtifact } from "@/types";
import { ref, computed, watch } from "vue";
import { isTempId, dayjs, $can } from "@/utils";
import InputGroup from "@/components/InputGroup.vue";
import SmallButton from "./SmallButton.vue";
import * as api from "@/api";
import { cloneDeep } from "lodash";
import { Td } from "@/components/Table";

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
  () => {
    localArtifact.value = cloneDeep(props.artifact);
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
<style scoped></style>
