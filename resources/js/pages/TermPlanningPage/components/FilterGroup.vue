<template>
  <!--
    One group is one flex item in the sidebar's column, and the open groups
    divide the column between them. Each grows in proportion to its row
    count up to a cap, so a five-row Type list takes a small share and the
    long lists split the rest evenly rather than the longest (259 sections)
    swallowing the column. `min-h-8` is the header's height: whatever the
    split, no header is ever squeezed out of view. Only the body scrolls.
  -->
  <section
    class="tw-flex tw-min-h-8 tw-flex-col"
    :class="isOpen ? 'tw-shrink tw-basis-0' : 'tw-flex-none'"
    :style="isOpen ? { flexGrow: Math.min(count, GROW_CAP) } : undefined"
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
  /** How many things the group lists in all, shown on the header. */
  count: number;
  /** How many of them are checked; the Clear button appears once any are. */
  checkedCount: number;
}>();

const emit = defineEmits<{ clear: [] }>();

/** Rows beyond this earn a group no more of the column. */
const GROW_CAP = 10;

const isOpen = ref(true);
</script>
