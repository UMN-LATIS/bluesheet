<template>
  <ul class="tw-m-0 tw-list-none tw-divide-y tw-divide-neutral-100 tw-p-0">
    <li v-for="item in visible" :key="item.value">
      <slot :item="item" />
    </li>
  </ul>
  <button
    v-if="hasMore"
    type="button"
    class="tw-block tw-w-full tw-cursor-pointer tw-border-none tw-bg-transparent tw-py-2 tw-text-center tw-text-sm tw-text-umn-maroon hover:tw-underline"
    @click="isExpanded = true"
  >
    Show all {{ items.length }}
  </button>
</template>

<script setup lang="ts" generic="T extends { value: string }">
import { computed, ref } from "vue";

/**
 * A list that starts short. Every group in the sidebar is long enough to
 * need this (a department offers dozens of courses and hundreds of
 * sections), and a sidebar that opens at full length is a wall.
 */
const props = defineProps<{
  items: T[];
}>();

/** Enough rows to recognise the list, few enough to see the next group. */
const INITIAL_ROW_COUNT = 6;

const isExpanded = ref(false);

const hasMore = computed(
  () => !isExpanded.value && props.items.length > INITIAL_ROW_COUNT,
);

const visible = computed(() =>
  hasMore.value ? props.items.slice(0, INITIAL_ROW_COUNT) : props.items,
);
</script>
