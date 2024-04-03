<template>
  <tr data-cy="leaveArtifactRow">
    <Td></Td>
    <template v-if="canModifyLeave && (isEditing || isNewArtifact)">
      <Td colspan="3">
        <InputGroup
          v-model="localArtifact.label"
          :required="true"
          label="Label"
          placeholder="Artifact Label"
          :showLabel="false"
          data-cy="artifactLabelInput"
          inputClass="tw-bg-white tw-border-neutral-200"
        />
      </Td>
      <Td colspan="2">
        <InputGroup
          v-model="localArtifact.target"
          :required="true"
          label="URL"
          :showLabel="false"
          placeholder="Artifact URL"
          data-cy="artifactTargetInput"
          inputClass="tw-bg-white tw-border-neutral-200"
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
          v-if="hasValidUrl"
          :href="localArtifact.target"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {{ localArtifact.label }}
        </a>
        <div v-else>{{ localArtifact.label }}</div>
        <div class="tw-text-neutral-500 tw-text-xs">
          {{ localArtifact.target }}
        </div>
      </Td>
      <Td class="tw-text-sm">
        {{ dayjs(artifact.created_at).format("MMM D, YYYY") }}
      </Td>
      <Td class="tw-text-sm">
        {{ dayjs(artifact.updated_at).format("MMM D, YYYY") }}
      </Td>
      <Td v-if="canModifyLeave">
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
import { ref, reactive, computed, watch } from "vue";
import { isTempId, dayjs } from "@/utils";
import InputGroup from "@/components/InputGroup.vue";
import SmallButton from "./SmallButton.vue";
import { Td } from "@/components/Table";
import { useUserStore } from "@/stores/useUserStore";

const props = defineProps<{
  leave: Leave;
  artifact: LeaveArtifact;
}>();

const userStore = useUserStore();

const localArtifact = reactive({
  label: props.artifact.label,
  target: props.artifact.target,
});

const isNewArtifact = computed(() => isTempId(props.artifact.id));
const isEditing = ref(isNewArtifact.value);
const canModifyLeave = computed(
  () =>
    props.leave.canCurrentUser?.update ||
    props.leave.canCurrentUser?.delete ||
    false,
);

const hasValidUrl = computed(() => {
  try {
    new URL(localArtifact.target);
    return true;
  } catch (e) {
    return false;
  }
});

watch(() => props.artifact, resetLocalArtifactToProps, { immediate: true });

function resetLocalArtifactToProps() {
  Object.keys(localArtifact).forEach((key) => {
    localArtifact[key] = props.artifact[key];
  });
}

function handleCancelEdit() {
  isNewArtifact.value
    ? userStore.deleteLeaveArtifact(props.artifact)
    : resetLocalArtifactToProps();
  isEditing.value = false;
}

function handleSave() {
  userStore.saveLeaveArtifact({
    ...props.artifact,
    ...localArtifact,
  });
  isEditing.value = false;
}

function handleDelete() {
  userStore.deleteLeaveArtifact(props.artifact);
}
</script>
<style scoped></style>
