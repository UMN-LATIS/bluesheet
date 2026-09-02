<!--
  A named part of the sheet that stays shut until asked for, with what it
  holds legible on its header. The header keeps working on a locked term,
  since looking is not changing; only its colour goes, because blue is the
  sheet's editing colour and two blue words in an otherwise inert panel read
  as the only live thing on it.
-->
<template>
  <div>
    <button
      type="button"
      class="tw-flex tw-w-full tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-border-none tw-bg-transparent tw-p-0 tw-text-[11.5px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      {{ label }}
      <span
        class="tw-text-[11px] tw-font-normal tw-normal-case tw-tracking-normal tw-text-on-surface-variant"
      >
        {{ summary }}
      </span>
      <span
        class="tw-ml-auto tw-text-[11px] tw-font-semibold tw-normal-case tw-tracking-normal"
        :class="isMuted ? 'tw-text-on-surface-variant' : 'tw-text-primary'"
      >
        {{ isOpen ? "Hide" : "Show" }}
      </span>
    </button>

    <div v-if="isOpen" class="tw-mt-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  label: string;
  /** What the part holds, read without opening it: "DIS · On campus", "1". */
  summary: string;
  /** Drops the editing colour where nothing on the panel can be edited. */
  isMuted?: boolean;
}>();

const isOpen = ref(false);
</script>
