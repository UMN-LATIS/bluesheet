<template>
  <div
    v-if="isSmall"
    class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-flex-col tw-bg-surface-bright"
  >
    <div class="tw-flex-none tw-pt-2">
      <div
        class="tw-mx-auto tw-h-1 tw-w-10 tw-rounded-full tw-bg-outline-variant"
      />
    </div>
    <div class="tw-min-h-0 tw-flex-1">
      <slot />
    </div>
  </div>

  <Pane
    v-else
    class="tw-absolute tw-inset-y-0 tw-right-3 tw-z-40 tw-shadow-[-18px_0_44px_rgba(38,38,38,0.16)] roomy:tw-right-4"
    :style="{ width: `${panelWidthPx}px` }"
  >
    <slot />
  </Pane>
</template>

<script setup lang="ts">
import Pane from "@/components/planning/Pane.vue";
import { useScreenSize } from "@/utils/useScreenSize";

defineProps<{ panelWidthPx: number }>();

const { isSmall } = useScreenSize();
</script>
