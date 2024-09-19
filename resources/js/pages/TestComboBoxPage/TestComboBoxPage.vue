<template>
  <PostIt class="tw-mb-4">
    <h1>Test Combobox Page</h1>
    <ComboBox
      v-model="selectedOption"
      :options="abridgedOptions"
      label="test"
    />
  </PostIt>
</template>
<script setup lang="ts">
import { PostIt } from "@umn-latis/cla-vue-template";
import { options } from "./options";
import { ComboBox, ComboBoxOptionType } from "./ComboBox";
import { computed, ref } from "vue";

const abridgedOptions = computed(() => {
  const maxOptions = Math.min(10, options.length);
  return options.slice(0, maxOptions);
});

const selectedOption = ref<ComboBoxOptionType | null>(null);
</script>
<style scoped></style>
