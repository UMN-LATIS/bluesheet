<template>
  <fieldset
    class="tw-m-0 tw-rounded-[10px] tw-border tw-border-solid tw-border-surface-container tw-px-3 tw-pb-2 tw-pt-1"
  >
    <legend
      class="tw-float-none tw-mb-0 tw-w-auto tw-px-1 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
    >
      Include
    </legend>

    <div class="tw-grid tw-grid-cols-2 tw-gap-x-4 cramped:tw-grid-cols-4">
      <label
        v-for="toggle in TOGGLES"
        :key="toggle.key"
        class="tw-m-0 tw-flex tw-cursor-pointer tw-items-start tw-gap-2.5 tw-py-1 tw-text-[12.5px] tw-font-normal tw-text-on-surface"
      >
        <input
          type="checkbox"
          class="tw-mt-0.5 tw-h-4 tw-w-4 tw-flex-none tw-rounded tw-border-outline tw-text-brand focus:tw-ring-brand"
          :checked="modelValue[toggle.key]"
          @change="
            emit('update:modelValue', {
              ...modelValue,
              [toggle.key]: ($event.target as HTMLInputElement).checked,
            })
          "
        />
        <span class="tw-min-w-0 tw-flex-1">
          <span class="tw-block tw-leading-tight">{{ toggle.label }}</span>
          <!-- Held open whether or not it has words in it, so ticking a box
               cannot shift the three boxes beside it. -->
          <span
            class="tw-block tw-min-h-[15px] tw-text-[11px] tw-leading-tight tw-text-on-surface-variant"
          >
            {{ modelValue[toggle.key] ? "" : toggle.whenOff }}
          </span>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import type { ImportOptions } from "../queries/useSectionBatch";

defineProps<{ modelValue: ImportOptions }>();

const emit = defineEmits<{ "update:modelValue": [ImportOptions] }>();

const TOGGLES: {
  key: keyof ImportOptions;
  label: string;
  whenOff: string;
}[] = [
  { key: "instructors", label: "Instructors", whenOff: "Arrives unassigned" },
  { key: "tas", label: "TAs", whenOff: "No assistants" },
  { key: "meetingTimes", label: "Meeting times", whenOff: "Arrives async" },
  {
    key: "sectionNumbers",
    label: "Section numbers",
    whenOff: "Numbered TBA1, TBA2",
  },
];
</script>
