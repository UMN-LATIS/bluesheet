<template>
  <div
    class="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-p-4"
  >
    <div
      class="tw-pointer-events-auto tw-max-w-md tw-rounded-2xl tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-8 tw-py-7 tw-text-center tw-shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
    >
      <h2 class="tw-m-0 tw-text-xl tw-font-bold tw-text-on-surface">
        Nothing planned for {{ termName }} yet
      </h2>

      <p class="tw-mb-6 tw-mt-2 tw-text-[13px] tw-text-on-surface-variant">
        Bring a term you've already planned over as a starting point, then
        adjust it.
      </p>

      <div class="tw-flex tw-flex-wrap tw-justify-center tw-gap-2.5">
        <button
          v-if="suggestedTermName"
          type="button"
          class="tw-min-h-11 tw-cursor-pointer tw-rounded-full tw-border-none tw-bg-primary tw-px-5 tw-text-[13px] tw-font-bold tw-text-on-primary"
          @click="emit('importFromSuggested')"
        >
          Import from {{ suggestedTermName }}
        </button>
        <button
          type="button"
          class="tw-min-h-11 tw-cursor-pointer tw-rounded-full tw-border tw-border-solid tw-border-outline tw-bg-surface-bright tw-px-5 tw-text-[13px] tw-font-bold tw-text-on-surface hover:tw-bg-surface"
          @click="emit('chooseTerm')"
        >
          Choose a term…
        </button>
      </div>

      <p class="tw-mb-0 tw-mt-5 tw-text-[12.5px] tw-text-on-surface-variant">
        Or start from scratch — click any hour to add a section.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  termName: string;
  /** Absent when the SIS has published nothing a year back to offer. */
  suggestedTermName: string | null;
}>();

const emit = defineEmits<{ importFromSuggested: []; chooseTerm: [] }>();
</script>
