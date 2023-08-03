<template>
  <div
    ref="comboboxContainerRef"
    class="combobox"
    :class="{
      'combobox--is-open': isComboboxOpen,
    }"
    tabindex="0"
    role="combobox"
    @keydown.enter="handleEnterKey"
    @keydown.down.prevent="handleArrowKeyNav"
    @keydown.up.prevent="handleArrowKeyNav"
  >
    <div class="combobox__input-group">
      <input
        v-bind="$attrs"
        ref="inputRef"
        :value="filterText"
        :class="inputClass"
        class="combobox__input"
        :aria-controls="comboboxResultsId"
        autocomplete="off"
        @input="handleInput"
        @focus="isComboboxOpen = true"
      />
      <button
        v-if="showClearButton && filterText.length && isComboboxOpen"
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
      <div
        v-if="isComboboxOpen"
        :id="comboboxResultsId"
        class="combobox__results"
      >
        <div v-if="!filteredOptions.length" class="combobox__no-items">
          <span>No results found</span>
        </div>
        <div class="p-1">
          <button
            v-if="shouldShowAddNewOptionButton"
            class="add-new-option-button"
            type="button"
            :disabled="!filterText.length"
            @click="handleAddNewOption"
          >
            Add New Option
          </button>
        </div>

        <slot name="prepend" />
        <button
          v-for="option in filteredOptions"
          :key="option.id ?? option.label"
          ref="optionRefs"
          class="combobox__item"
          :class="{
            'combobox__item--is-selected': isOptionSelected(option),
          }"
          type="button"
          @click="handleSelectOption(option)"
        >
          <span class="sr-only">Selected</span>
          <CheckIcon
            v-if="isOptionSelected(option)"
            class="combobox__check-icon"
          />
          <span class="combobox__name">{{ option.label }}</span>
          <span v-if="option.secondaryLabel" class="combobox__id">
            ({{ option.secondaryLabel }})
          </span>
        </button>

        <slot name="append" />
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
import CheckIcon from "@/icons/CheckIcon.vue";

interface Option {
  id?: string | number; // new options might have an undefined id
  label: string;
  secondaryLabel?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: Option | null;
    options: Option[];
    inputClass?: CSSClass;
    showClearButton?: boolean;
    canAddNewOption?: boolean;
  }>(),
  {
    showClearButton: false,
    inputClass: "",
    canAddNewOption: false,
  },
);

const emit = defineEmits<{
  (eventName: "update:modelValue", value: Option | null);
  (eventName: "update:options", value: Option[]): void;
}>();

const comboboxResultsId = `comboboxDropdownList-${Date.now()}`;

const comboboxContainerRef = ref<HTMLDivElement>();
const inputRef = ref<HTMLInputElement>();

// for tracking option elements for focus management
// with up/down arrow keys
const optionRefs = ref<HTMLElement[]>([]);

const filterText = ref(props.modelValue?.label ?? "");
const isComboboxOpen = ref(false);

function handleAddNewOption() {
  if (!props.canAddNewOption) {
    return;
  }

  // check that the option is not already in the list
  // if it is, then select it
  const existingOption = props.options.find(
    (option) => option.label === filterText.value,
  );

  if (existingOption) {
    return handleSelectOption(existingOption);
  }

  // otherwise add it to the list
  const newOption = {
    label: filterText.value,
  };
  emit("update:options", [...props.options, newOption]);
  handleSelectOption(newOption);
}

function isOptionSelected(option: Option) {
  if (!props.modelValue) {
    return false;
  }

  if (props.modelValue.id) {
    return props.modelValue.id === option.id;
  }

  return props.modelValue.label === option.label;
}

const filteredOptions = computed(() => {
  const sortedOptions = [...props.options].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  // if the selected option matches the filter text
  // then we want to show all the options
  const filterTextMatchesSelectedOption = props.modelValue
    ? props.modelValue.label
        .toLowerCase()
        .includes(filterText.value.toLowerCase())
    : false;
  if (!filterText.value || filterTextMatchesSelectedOption) {
    return sortedOptions;
  }

  return fuzzySearch(sortedOptions, filterText.value);
});

const shouldShowAddNewOptionButton = computed(() => {
  return (
    props.canAddNewOption && // can add new options
    filterText.value.length && // there is text in the input
    // and there are no exact matching labels
    !props.options.map((o) => o.label).includes(filterText.value)
  );
});

function fuzzySearch(options: Option[], query: string) {
  const fuse = new Fuse(options, {
    keys: ["label", "secondaryLabel"],
    threshold: 0.3,
  });

  return fuse.search(query).map((result) => result.item);
}

function handleInput(event: Event) {
  filterText.value = (event.target as HTMLInputElement).value;
}

function handleSelectOption(option: Option) {
  emit("update:modelValue", option);
  isComboboxOpen.value = false;
  inputRef.value?.blur();
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

    const selectedOption = getOption(props.modelValue);
    filterText.value = selectedOption?.label ?? "";
  },
);

function getOption(option: Partial<Option>): Option | null {
  if (option.id) {
    return props.options.find((opt) => opt.id === option.id) ?? null;
  }
  return props.options.find((opt) => opt.label === option.label) ?? null;
}

function handleArrowKeyNav(event: KeyboardEvent) {
  event.preventDefault();
  const direction = event.key === "ArrowDown" ? 1 : -1; // Determine the direction
  const activeElementIndex = optionRefs.value.indexOf(
    document.activeElement as HTMLElement,
  ); // Get current active element
  const nextElementIndex = activeElementIndex + direction;

  // if the next element is out of bounds, focus the input
  if (nextElementIndex >= optionRefs.value.length || nextElementIndex < 0) {
    inputRef.value?.focus();
    return;
  }

  // Focus the next element
  optionRefs.value[nextElementIndex]?.focus();
}

function handleEnterKey(event: KeyboardEvent) {
  event.preventDefault();

  const activeElementIndex = optionRefs.value.indexOf(
    document.activeElement as HTMLElement,
  );
  const activeOption = filteredOptions.value[activeElementIndex];

  // if there's an active option, select it
  if (activeOption) {
    return handleSelectOption(activeOption);
  }

  // if there's no active option and the filter is empty
  // clear the selected option
  if (!filterText.value) {
    return handleClear();
  }

  // if there's no active option and we can add new options
  // then add the filter text as a new option
  if (props.canAddNewOption) {
    return handleAddNewOption();
  }
}
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
  padding-right: 0;
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
  align-items: center;
  gap: 0.5rem;
  padding-left: 2rem;
}

.combobox__item.combobox__item--is-selected,
.combobox__item.combobox__item--is-selected:is(:hover, :focus) {
  background: #d5ecff;
  padding-left: 0.5rem;
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

.add-new-option-button {
  background: #111;
  border: none;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ddd;
  width: 100%;
  padding: 0.25rem 0.5rem;
}
</style>
