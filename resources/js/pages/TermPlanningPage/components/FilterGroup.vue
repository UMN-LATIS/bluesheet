<template>
  <section>
    <button
      type="button"
      class="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-2 tw-border-0 tw-border-y tw-border-solid tw-border-neutral-200 tw-bg-neutral-100 tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-neutral-700"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span
        class="tw-w-3 tw-text-[0.6rem] tw-text-neutral-500"
        aria-hidden="true"
      >
        {{ isOpen ? "▼" : "▶" }}
      </span>
      <span class="tw-flex-1">{{ title }}</span>
      <span class="tw-font-normal tw-normal-case tw-text-neutral-500">
        {{ count }}
      </span>
    </button>
    <div v-if="isOpen">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  title: string;
  /** How many things the group lists in all, shown on the header. */
  count: number;
  isOpenAtFirst?: boolean;
}>();

const isOpen = ref(props.isOpenAtFirst ?? false);
</script>
