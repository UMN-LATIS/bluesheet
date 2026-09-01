<template>
  <section>
    <!--
      Sticky to the list's scroll box, so the group a row belongs to stays
      named while its rows go past. `h-8` is what level rows below pin their
      own offset to.
    -->
    <div
      class="tw-sticky tw-top-0 tw-z-20 tw-flex tw-h-8 tw-items-center tw-gap-2 tw-border-0 tw-border-y tw-border-solid tw-border-neutral-200 tw-bg-neutral-100 tw-pr-3 tw-text-xs tw-text-neutral-700"
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
  /** How many of them are checked; the Clear button appears once any are. */
  checkedCount: number;
  isOpenAtFirst?: boolean;
}>();

const emit = defineEmits<{ clear: [] }>();

const isOpen = ref(props.isOpenAtFirst ?? false);
</script>
