<!--
  Where the detail sheet sits. Docked beside the canvas when there is room for
  it, lifted over the canvas when there is not, and over the whole phone screen
  below that. The sheet itself is the same in all three, so it is written once
  in the slot and this decides only where it lands.
-->
<template>
  <Pane v-if="isLarge" class="tw-w-[404px] tw-flex-none">
    <slot />
  </Pane>

  <div
    v-else-if="isSmall"
    class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-flex-col tw-bg-surface-bright"
  >
    <!-- Marks the sheet as a panel dragged up over a phone screen. -->
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
    class="tw-absolute tw-inset-y-0 tw-right-3 tw-z-50 tw-w-[380px] tw-shadow-[-18px_0_44px_rgba(38,38,38,0.16)]"
  >
    <slot />
  </Pane>
</template>

<script setup lang="ts">
import Pane from "./Pane.vue";
import { useScreenSize } from "../useScreenSize";

const { isLarge, isSmall } = useScreenSize();
</script>
