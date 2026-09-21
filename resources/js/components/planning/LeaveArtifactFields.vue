<template>
  <div
    class="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-bg-surface tw-p-2.5"
  >
    <input
      v-model="label"
      placeholder="Label"
      aria-label="Artifact label"
      class="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-2.5 tw-py-1.5 tw-text-[13px]"
    />
    <input
      v-model="target"
      placeholder="https://…"
      aria-label="Artifact URL"
      class="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-2.5 tw-py-1.5 tw-text-[13px]"
    />
    <div class="tw-flex tw-justify-end tw-gap-2">
      <Button variant="secondary" @click="emit('cancel')">Cancel</Button>
      <Button
        variant="primary"
        :disabled="!isComplete"
        @click="emit('save', { label, target })"
      >
        Save
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { ArtifactPayload } from "@/api/leavePlanningApi";
import Button from "@/components/Button.vue";

const props = withDefaults(defineProps<{ label?: string; target?: string }>(), {
  label: "",
  target: "",
});

const emit = defineEmits<{ save: [payload: ArtifactPayload]; cancel: [] }>();

const label = ref(props.label);
const target = ref(props.target);

const isComplete = computed(
  () => label.value.trim() !== "" && target.value.trim() !== "",
);
</script>
