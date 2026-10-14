<template>
  <MissingRate v-if="dollars === null" />
  <template v-else>{{ formatWholeDollars(dollars) }}</template>
</template>

<script setup lang="ts">
import MissingRate from "./MissingRate.vue";
import { formatWholeDollars } from "../../helpers/money";

defineProps<{ dollars: number | null }>();
</script>
