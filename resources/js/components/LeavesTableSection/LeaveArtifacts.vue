<template>
  <tbody class="tw-bg-neutral-100 tw-shadow-inner">
    <tr>
      <th></th>
      <th colspan="8" class="tw-p-2">
        <h3 class="tw-text-sm tw-italic tw-leading-loose tw-m-0">
          Artifacts for {{ leave.description || "Leave" }}
        </h3>
        <p
          v-if="!leave.artifacts?.length"
          class="tw-italic tw-text-sm tw-text-neutral-500 tw-mb-2"
        >
          Link to a document or website related to this leave.
        </p>
      </th>
    </tr>

    <LeaveArtifactRow
      v-for="artifact in localArtifacts"
      :key="artifact.id"
      :artifact="artifact"
      :leave="leave"
      @update="handleUpdateArtifact"
      @delete="handleDeleteArtifact"
    />
    <tr>
      <td></td>
      <td colspan="8" class="p-2">
        <Button variant="tertiary" class="-tw-ml-2" @click="handleAddArtifact">
          Add Artifact
        </Button>
      </td>
    </tr>
  </tbody>
</template>
<script setup lang="ts">
import { reactive } from "vue";
import { Leave, LeaveArtifact } from "@/types";
import Button from "@/components/Button.vue";
import LeaveArtifactRow from "./LeaveArtifactRow.vue";
import { getTempId } from "@/utils";

const props = defineProps<{
  leave: Leave;
  isEditing: boolean;
}>();

const localArtifacts = reactive<LeaveArtifact[]>(props.leave.artifacts ?? []);

function handleAddArtifact() {
  localArtifacts.push({
    id: getTempId(),
    label: "",
    target: "",
    leave_id: props.leave.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

function handleUpdateArtifact(artifact: LeaveArtifact) {
  const index = localArtifacts.findIndex((a) => a.id === artifact.id);
  if (index === -1) return;
  localArtifacts.splice(index, 1, artifact);
}

function handleDeleteArtifact(artifact: LeaveArtifact) {
  const index = localArtifacts.findIndex((a) => a.id === artifact.id);
  if (index === -1) return;
  localArtifacts.splice(index, 1);
}
</script>
<style scoped></style>
