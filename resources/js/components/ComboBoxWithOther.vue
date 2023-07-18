<template>
  <ComboBox
    :modelValue="modelValue"
    :options="options"
    placeholder="Select..."
    @update:modelValue="handleUpdateGroupType"
  >
    <template #append="{ close: closeCombobox }">
      <div class="other-option-group">
        <input
          v-model="newGroupType"
          type="text"
          placeholder="Other"
          @keydown.enter.stop="
            () => {
              handleAddNewGroupType();
              closeCombobox();
            }
          "
        />
        <button
          type="button"
          :disabled="!newGroupType"
          @click="
            () => {
              handleAddNewGroupType();
              closeCombobox();
            }
          "
        >
          <CheckIcon />
          <span class="sr-only">Add Option</span>
        </button>
      </div>
    </template>
  </ComboBox>
</template>
<script setup lang="ts">
import { ref } from "vue";
import ComboBox, { type Option } from "./ComboBox.vue";
import CheckIcon from "@/icons/CheckIcon.vue";

const props = defineProps<{
  options: Option[];
  modelValue: Option | null;
}>();

const emit = defineEmits<{
  (eventName: "update:modelValue", value: Option | null): void;
  (eventName: "update:options", value: Option[]): void;
}>();

const newGroupType = ref("");

function handleAddNewGroupType() {
  const newOption = {
    id: newGroupType.value,
    label: newGroupType.value,
  };
  emit("update:options", [...props.options, newOption]);
  emit("update:modelValue", newOption);
  newGroupType.value = "";
}

function handleUpdateGroupType(value: Option | null) {
  emit("update:modelValue", value);
}
</script>
<style scoped>
.other-option-group {
  display: flex;
  margin: 0.5rem;
  padding-top: 0;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
}

.other-option-group input {
  flex: 1;
  background: #f3f3f3;
  border: 0;
  padding: 0.5rem 0.75rem;
  border-top-left-radius: 0.25rem;
  border-bottom-left-radius: 0.25rem;
}

.other-option-group button {
  background: trasparent;
  border: none;
  border-top-right-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ddd;
}
.other-option-group button:not(:disabled):hover {
  background: #111;
}

.other-option-group button:not(:disabled) {
  background: #333;
}
</style>
