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
        {{ dayjs(artifact.created_at).format("MMM D, YYYY") }}
      </Td>
      <Td class="tw-text-sm">
        {{ dayjs(artifact.updated_at).format("MMM D, YYYY") }}
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
import { ref, reactive, computed, watch } from "vue";
import { isTempId, dayjs, $can } from "@/utils";
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
