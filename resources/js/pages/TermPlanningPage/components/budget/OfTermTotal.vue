<template>
  <span class="tw-font-normal tw-tracking-normal tw-text-on-surface-variant"
    >&nbsp;/&nbsp;{{ formatWholeDollars(dollars) }}</span
  >
</template>

<script setup lang="ts">
import { formatWholeDollars } from "../../helpers/money";

defineProps<{ dollars: number }>();
</script>
