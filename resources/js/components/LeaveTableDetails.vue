<template>
  <tr class="tw-bg-neutral-100 tw-shadow-inner">
    <td></td>
    <td colspan="8" class="tw-p-2">
      <h3 class="tw-text-sm tw-font-semibold tw-leading-loose tw-m-0">
        Artifacts for {{ leave.description || "Leave" }}
      </h3>

      <template v-if="isEditing">
        <div
          v-for="artifact in leave.artifacts"
          :key="artifact.id"
          class="tw-grid tw-grid-cols-2 tw-gap-2 tw-mb-4"
        >
          <InputGroup
            :modelValue="artifact.label"
            label="Label"
            placeholder="Artifact Label"
            :showLabel="false"
            @update:modelValue="
              handleEditArtifact({
                ...artifact,
                label: $event,
              })
            "
          />
          <InputGroup
            :modelValue="artifact.target"
            label="URL"
            :showLabel="false"
            placeholder="Artifact URL"
            @update:modelValue="
              handleEditArtifact({
                ...artifact,
                target: $event,
              })
            "
          />
        </div>
      </template>
      <ul v-else class="tw-list-none tw-p-0 tw-m-0">
        <li v-for="artifact in leave.artifacts" :key="artifact.id">
          <component
            :is="artifact.target ? 'a' : 'span'"
            :href="artifact.target"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ artifact.label || "No Artifact Label" }}
          </component>
        </li>
      </ul>
      <p
        v-if="!leave.artifacts?.length"
        class="tw-italic tw-text-sm tw-text-neutral-500 tw-mb-2"
      >
        Link to a document or website related to this leave.
      </p>
      <Button
        v-if="isEditing"
        variant="tertiary"
        class="-tw-ml-2"
        @click="handleAddArtifact"
      >
        Add Artifact
      </Button>
    </td>
  </tr>
</template>
<script setup lang="ts">
import { Leave, LeaveArtifact } from "@/types";
import { Td } from "./Table";
import Button from "./Button.vue";
import InputGroup from "./InputGroup.vue";
import { dayjs, getTempId } from "@/utils";

const props = defineProps<{
  leave: Leave;
  isEditing: boolean;
}>();

const emit = defineEmits<{
  (eventName: "update", value: Leave): void;
}>();

function handleAddArtifact() {
  const updatedLeave = {
    ...props.leave,
    artifacts: [...(props.leave.artifacts ?? []), createLeaveArtifact()],
  };
  emit("update", updatedLeave);
}

function createLeaveArtifact(): LeaveArtifact {
  return {
    id: getTempId(),
    label: "",
    target: "",
    leave_id: props.leave.id,
    created_at: dayjs().toISOString(),
    updated_at: dayjs().toISOString(),
  };
}

function handleEditArtifact(artifact: LeaveArtifact) {
  const updatedArtifacts = (props.leave.artifacts ?? []).map((a) => {
    return a.id === artifact.id ? artifact : a;
  });

  const updatedLeave = {
    ...props.leave,
    artifacts: updatedArtifacts,
  };
  emit("update", updatedLeave);
}

function handleDeleteArtifact(artifact: LeaveArtifact) {
  console.log("handleDeleteArtifact");
}
</script>
<style scoped></style>
