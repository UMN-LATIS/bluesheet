<template>
  <!--
    One group is one flex item in the sidebar's column. Its basis is its
    natural height and it may shrink, so when the groups together outgrow
    the column each gives up room in proportion to its size: the long
    Courses list shrinks most, the five-row Type list hardly at all. The
    header never scrolls away, because only the body below it is the scroll
    box.
  -->
  <section
    class="tw-flex tw-min-h-0 tw-flex-col"
    :class="isOpen ? 'tw-shrink' : 'tw-flex-none'"
  >
    <div
      class="tw-flex tw-h-8 tw-flex-none tw-items-center tw-gap-2 tw-border-0 tw-border-y tw-border-solid tw-border-neutral-200 tw-bg-neutral-100 tw-pr-3 tw-text-xs tw-text-neutral-700"
    >
      <button
        type="button"
        class="tw-flex tw-h-full tw-flex-1 tw-cursor-pointer tw-items-center tw-gap-2 tw-border-none tw-bg-transparent tw-px-3 tw-text-left tw-font-semibold tw-uppercase tw-tracking-wide tw-text-inherit"
        :aria-expanded="isOpen"
        @click="isOpen = !isOpen"
      >
        <span
          class="tw-w-3 tw-text-[0.6rem] tw-text-neutral-500"
          aria-hidden="true"
        >
          {{ isOpen ? "▼" : "▶" }}
        </span>
        {{ title }}
      </button>
      <button
        v-if="checkedCount > 0"
        type="button"
        class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-font-semibold tw-text-umn-maroon hover:tw-underline"
        @click="emit('clear')"
      >
        Clear
      </button>
      <span class="tw-text-neutral-500">{{ count }}</span>
    </div>
    <div v-if="isOpen" class="tw-min-h-0 tw-flex-1 tw-overflow-y-auto">
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

const isOpen = ref(true);
</script>
