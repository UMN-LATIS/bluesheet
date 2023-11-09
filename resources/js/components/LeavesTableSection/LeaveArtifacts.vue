<template>
  <tbody class="leave-artifacts tw-bg-neutral-100 tw-shadow-inner">
    <tr>
      <Th></Th>
      <Th colspan="3"> Artifacts for {{ leave.description }} </Th>
      <Th>Created</Th>
      <Th>Updated</Th>
      <Th v-if="$can('edit leaves')">
        <span class="tw-sr-only">Actions</span>
      </Th>
    </tr>

    <LeaveArtifactRow
      v-for="artifact in localArtifacts"
      :key="artifact.id"
      :artifact="artifact"
      :leave="leave"
      @update="handleUpdateArtifact"
      @delete="handleDeleteArtifact"
    />
    <tr v-if="$can('edit leaves')">
      <Td></Td>
      <Td
        colspan="8"
        class="tw-border-0 tw-border-t tw-border-solid tw-border-neutral-200"
      >
        <SmallButton variant="primary" @click="handleAddArtifact">
          Add Artifact
        </SmallButton>
      </Td>
    </tr>
  </tbody>
</template>
<script setup lang="ts">
import { reactive } from "vue";
import { Leave, LeaveArtifact } from "@/types";
import Button from "@/components/Button.vue";
import LeaveArtifactRow from "./LeaveArtifactRow.vue";
import { getTempId, $can } from "@/utils";
import { Th, Td } from "../Table";
import SmallButton from "./SmallButton.vue";

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
<style scoped>
.leave-artifacts th:not(:first-child) {
  font-style: italic;
  font-size: 0.75rem;
  border-bottom: 1px solid #ddd;
}
</style>
