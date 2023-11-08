<template>
  <tbody class="tw-bg-neutral-100 tw-shadow-inner">
    <tr v-for="artifact in localArtifacts" :key="artifact.id">
      <Td></Td>
      <Td colspan="3">
        <InputGroup
          v-if="isEditing"
          v-model="artifact.label"
          label="Label"
          placeholder="Artifact Label"
          :showLabel="false"
        />
        <span v-else>{{ artifact.label }}</span>
      </Td>
      <Td colspan="2">
        <InputGroup
          v-if="isEditing"
          v-model="artifact.target"
          label="URL"
          :showLabel="false"
          placeholder="Artifact URL"
        />
        <span v-else>{{ artifact.target }}</span>
      </Td>
      <Td>
        <div v-if="isEditing">
          <Button
            variant="tertiary"
            class="disabled:hover:tw-bg-transparent disabled:tw-text-neutral-400 disabled:tw-cursor-not-allowed tw-mr-2"
            @click="handleCancelEditArtifact(artifact)"
          >
            Cancel
          </Button>
          <Button
            variant="tertiary"
            class="!tw-bg-bs-blue tw-text-white disabled:tw-opacity-25"
            @click="handleSaveArtifact(artifact)"
          >
            Save
          </Button>
        </div>
        <div v-else>
          <Button variant="tertiary" @click="handleEditArtifact(artifact)"
            >Edit</Button
          >
          <Button variant="danger" @click="handleDeleteArtifact(artifact)">
            Delete
          </Button>
        </div>
      </Td>
    </tr>
    <tr>
      <td colspan="8" class="tw-p-4 tw-text-center">
        <Button variant="tertiary" @click="handleAddArtifact">
          Add Artifact
        </Button>
      </td>
    </tr>
  </tbody>
</template>
<script setup lang="ts">
import { ref, reactive } from "vue";
import { Leave, LeaveArtifact, LoadState, NewLeave } from "@/types";
import { Td } from "./Table";
import Button from "./Button.vue";
import InputGroup from "./InputGroup.vue";
import { $can, dayjs, getTempId, isTempId } from "@/utils";
import * as api from "@/api";

const props = defineProps<{
  leave: Leave;
}>();

const emit = defineEmits<{
  (eventName: "update", value: Leave);
}>();

const localArtifacts = reactive(props.leave.artifacts || []);
const isEditing = reactive(new Set<number | string>());

function handleAddArtifact() {
  const newArtifact = createLeaveArtifact();
  localArtifacts.push(newArtifact);
  isEditing.add(newArtifact.id);
}

function createLeaveArtifact() {
  const id = getTempId();
  const newArtifact: LeaveArtifact = {
    id,
    label: "",
    target: "",
    leave_id: props.leave.id,
    created_at: dayjs().toISOString(),
    updated_at: dayjs().toISOString(),
  };
  return newArtifact;
}

function handleEditArtifact(artifact: LeaveArtifact) {
  isEditing.add(artifact.id);
}

function handleCancelEditArtifact(artifact: LeaveArtifact) {
  isEditing.delete(artifact.id);

  const localArtifactIndex = localArtifacts.findIndex(
    (a) => a.id === artifact.id,
  );

  if (localArtifactIndex === -1) return;

  // if the artifact is new, remove it
  if (isTempId(artifact.id)) {
    localArtifacts.splice(localArtifactIndex, 1);
    return;
  }

  if (!props.leave.artifacts) {
    throw new Error(
      `cannot cancel edit: no artifacts defined on leave with id ${props.leave.id}.`,
    );
  }

  // otherwise, restore the artifact to its original state
  const originalArtifactIndex = props.leave.artifacts.findIndex(
    (a) => a.id === artifact.id,
  );

  // if the original artifact is not found, throw an error
  if (originalArtifactIndex === -1) {
    throw new Error(
      `cannot cancel edit correctly. Problem finding original artifact with id ${artifact.id}.`,
    );
  }

  localArtifacts.splice(
    localArtifactIndex,
    1,
    props.leave.artifacts[originalArtifactIndex],
  );
}

const isSaving = ref(false);
async function handleSaveArtifact(artifact: LeaveArtifact) {
  isSaving.value = true;
  try {
    // create a new leave
    await api.createLeaveArtifact(artifact);

    // emit the update
    emit("update", {
      ...props.leave,
      artifacts: localArtifacts,
    });
  } catch (error) {
    throw new Error(`error saving artifact: ${error}`);
  } finally {
    isSaving.value = false;
  }

  // emit the update
}

function handleDeleteArtifact(artifact: LeaveArtifact) {
  console.log("handleDeleteArtifact");
}
</script>
<style scoped></style>
