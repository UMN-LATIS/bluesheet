<template>
  <!--
    Short groups take their natural height; long ones split the rest of
    the column and scroll inside. `min-h-8` keeps every header in view.
  -->
  <section
    class="tw-flex tw-min-h-8 tw-flex-col"
    :class="
      isOpen && count > SHORT_GROUP_MAX_ROWS ? 'tw-flex-1' : 'tw-flex-none'
    "
  >
    <div
      class="tw-flex tw-h-8 tw-flex-none tw-items-center tw-gap-2 tw-bg-surface-container-high tw-pr-3 tw-text-xs tw-text-on-surface"
    >
      <button
        type="button"
        class="tw-flex tw-h-full tw-flex-1 tw-cursor-pointer tw-items-center tw-gap-2 tw-border-none tw-bg-transparent tw-px-3 tw-text-left tw-font-semibold tw-uppercase tw-tracking-wide tw-text-inherit"
        :aria-expanded="isOpen"
        @click="isOpen = !isOpen"
      >
        <span
          class="tw-w-3 tw-text-[0.6rem] tw-text-on-surface-variant"
          aria-hidden="true"
        >
          {{ isOpen ? "▼" : "▶" }}
        </span>
        {{ title }}
      </button>
      <button
        v-if="checkedCount > 0"
        type="button"
        class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-font-semibold tw-text-brand hover:tw-underline"
        @click="emit('clear')"
      >
        Clear
      </button>
      <span class="tw-text-on-surface-variant">{{ count }}</span>
    </div>
    <div
      v-if="isOpen"
      class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-y-auto"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  title: string;
  count: number;
  checkedCount: number;
}>();

const emit = defineEmits<{ clear: [] }>();

const SHORT_GROUP_MAX_ROWS = 8;

const isOpen = ref(true);
</script>
