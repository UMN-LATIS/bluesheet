<template>
  <div>
    <div class="tw-mb-2 tw-flex tw-items-center tw-justify-between">
      <FieldLabel class="!tw-mb-0">Artifacts</FieldLabel>
      <button
        v-if="isEditable && !isAdding"
        type="button"
        class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[11px] tw-font-semibold tw-text-primary"
        @click="isAdding = true"
      >
        Add
      </button>
    </div>

    <p
      v-if="artifacts.length === 0 && !isAdding"
      class="tw-m-0 tw-text-[13px] tw-text-on-surface-variant"
    >
      None
    </p>

    <ul class="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1.5 tw-p-0">
      <li v-for="artifact in artifacts" :key="artifact.id">
        <LeaveArtifactFields
          v-if="editingId === artifact.id"
          :label="artifact.label"
          :target="artifact.target"
          @cancel="editingId = null"
          @save="
            (payload) => {
              editingId = null;
              emit('save', Number(artifact.id), payload);
            }
          "
        />
        <div
          v-else
          class="tw-flex tw-items-start tw-gap-2 tw-rounded-lg tw-px-1 tw-py-1"
        >
          <div class="tw-min-w-0 tw-flex-1">
            <a
              v-if="isValidUrl(artifact.target)"
              :href="artifact.target"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="tw-block tw-truncate tw-text-[13px] tw-text-primary"
            >
              {{ artifact.label }}
            </a>
            <span v-else class="tw-block tw-truncate tw-text-[13px]">
              {{ artifact.label }}
            </span>
            <span
              class="tw-block tw-truncate tw-text-[11px] tw-text-on-surface-variant"
            >
              {{ artifact.target }}
            </span>
          </div>
          <template v-if="isEditable">
            <button
              type="button"
              class="tw-flex-none tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[11px] tw-font-semibold tw-text-primary"
              @click="editingId = artifact.id"
            >
              Edit
            </button>
            <button
              type="button"
              class="tw-flex-none tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[11px] tw-font-semibold tw-text-error"
              @click="emit('delete', Number(artifact.id))"
            >
              Delete
            </button>
          </template>
        </div>
      </li>

      <li v-if="isAdding">
        <LeaveArtifactFields
          @cancel="isAdding = false"
          @save="
            (payload) => {
              isAdding = false;
              emit('create', payload);
            }
          "
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { LeaveArtifact } from "@/types";
import type { ArtifactPayload } from "@/api/leavePlanningApi";
import { isValidUrl } from "@/utils/isValidUrl";
import FieldLabel from "./FieldLabel.vue";
import LeaveArtifactFields from "./LeaveArtifactFields.vue";

defineProps<{
  artifacts: LeaveArtifact[];
  isEditable: boolean;
}>();

const emit = defineEmits<{
  create: [payload: ArtifactPayload];
  save: [artifactId: number, payload: ArtifactPayload];
  delete: [artifactId: number];
}>();

const isAdding = ref(false);
const editingId = ref<number | string | null>(null);
</script>
