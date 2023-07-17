<template>
  <div
    ref="comboboxContainerRef"
    class="combobox"
    :class="{
      'combobox--is-open': isComboboxOpen,
    }"
  >
    <div class="combobox__input-group">
      <input
        v-bind="$attrs"
        ref="inputRef"
        :value="filterText"
        :class="inputClass"
        class="combobox__input"
        @input="handleInput"
        @focus="isComboboxOpen = true"
      />
      <button
        v-if="filterText.length"
        class="combobox__clear-button"
        @click="handleClear"
      >
        <CircleXIcon />
      </button>

      <button
        class="combobox__toggle-button"
        @click="isComboboxOpen = !isComboboxOpen"
      >
        <ChevronDownIcon class="chevron-icon" />
      </button>
    </div>

    <Transition name="fade-slide">
      <div v-if="isComboboxOpen" class="combobox__results">
        <div v-if="!options.length" class="combobox__no-items">
          No results found
        </div>

        <button
          v-for="option in filteredOptions"
          :key="option.id"
          class="combobox__item"
          type="button"
          @click="$emit('update:modelValue', option.id)"
        >
          <span class="combobox__name">{{ option.label }}</span>
          <span v-if="option.secondaryLabel" class="combobox__id">
            ({{ option.secondaryLabel }})
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { onClickOutside } from "@vueuse/core";
import { CSSClass } from "@/types";
import Fuse from "fuse.js";
import CircleXIcon from "@/icons/CircleXIcon.vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";

interface Option {
  id: string | number;
  label: string;
  secondaryLabel?: string;
}

const props = defineProps<{
  modelValue: string | number | null;
  options: Option[];
  inputClass?: CSSClass;
}>();

const emit = defineEmits<{
  (eventName: "update:modelValue", value: string | null);
}>();

const comboboxContainerRef = ref<HTMLDivElement>();
const inputRef = ref<HTMLInputElement>();
const filterText = ref("");
const isComboboxOpen = ref(false);

function fuzzySearch(options: Option[], query: string) {
  const fuse = new Fuse(options, {
    keys: ["label", "secondaryLabel"],
    threshold: 0.3,
  });

  return fuse.search(query).map((result) => result.item);
}

const filteredOptions = computed(() => {
  if (!filterText.value) return props.options;

  return fuzzySearch(props.options, filterText.value);
});

function handleInput(event: Event) {
  filterText.value = (event.target as HTMLInputElement).value;
}

function handleClear() {
  filterText.value = "";
  emit("update:modelValue", null);
  inputRef.value?.focus();
}

onClickOutside(comboboxContainerRef, () => {
  isComboboxOpen.value = false;
});

watch(
  () => props.modelValue,
  () => {
    if (!props.modelValue) {
      filterText.value = "";
      return;
    }

    const selectedOption = props.options.find(
      (opt) => String(opt.id) === String(props.modelValue),
    );
    filterText.value = selectedOption?.label ?? "";
  },
);
</script>
<style scoped>
.combobox {
  position: relative;
}

.combobox__input-group {
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
}

.combobox__input-group:focus-within {
  border: 1px solid #a1cbef;
  box-shadow: 0 0 0 0.2rem rgba(52, 144, 220, 0.25);
}

.combobox__clear-button {
  border: 0;
  height: 2rem;
  width: 2rem;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: #ccc;
}

.combobox__input {
  border: none;
  background: transparent;
  display: block;
  width: 100%;
  border: none;
  flex: 1;
  padding: 0.5rem 0.75rem;
}
.combobox__input:focus {
  outline: none;
}

.combobox__no-items {
  padding: 0.5rem;
  text-align: center;
  color: #999;
  font-size: 0.875rem;
}

.combobox__results {
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  position: absolute;
  top: 100%;
  width: 100%;
  max-height: 20rem;
  overflow-y: auto;
  z-index: 10;
  background: white;
  margin-top: 0.25rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  flex-direction: column;
  display: flex;
}

.combobox__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.combobox__item {
  background: transparent;
  padding: 0.33rem 0.5rem;
  border: 0;
  display: flex;
  text-align: left;
  justify-content: space-between;
}

.combobox__item:is(:hover, :focus) {
  background: #f5f5f5;
  cursor: pointer;
}

.combobox__name {
  flex: 1;
}
.combobox__id {
  color: #999;
  font-size: 0.875rem;
}

.combobox__toggle-button {
  background: transparent;
  border: 0;
  transition: transform 0.15s cubic-bezier(1, 0.5, 0.8, 1);
}

.combobox--is-open .combobox__toggle-button {
  transform: rotate(180deg);
}
</style>
