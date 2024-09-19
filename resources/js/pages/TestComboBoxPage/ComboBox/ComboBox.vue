<template>
  <div class="combobox-w-label">
    <label
      :for="`combobox-${label}__input`"
      :class="{
        'tw-sr-only': hideLabel,
      }"
      >{{ label }}</label
    >
    <div ref="comboboxContainerRef" @keydown="handleKeyDown">
      <button
        v-if="modelValue"
        ref="selectedItemRef"
        class="tw-flex tw-bg-transparent tw-border tw-border-neutral-300 tw-w-full tw-py-3 tw-px-4 tw-items-center tw-justify-between tw-rounded-md"
        @click="areOptionsOpen = !areOptionsOpen"
      >
        {{ modelValue.label }}
      </button>
      <div
        class="tw-flex tw-bg-transparent tw-border tw-border-neutral-300 tw-w-full tw-py-3 tw-px-4 tw-items-center tw-justify-between tw-rounded-md focus-within:tw-ring-2 focus-within:tw-ring-blue-500"
      >
        <input
          :id="`combobox-${label}__input`"
          v-model="query"
          class="tw-border-none tw-bg-transparent tw-block tw-w-full tw-text-neutral-900 focus:tw-outline-none"
          :placeholder="placeholder"
          role="combobox"
          :aria-controls="`combobox-${label}__options`"
          aria-autocomplete="list"
          :aria-expanded="areOptionsOpen"
          @focus="areOptionsOpen = true"
        />
        <ChevronDownIcon
          class="tw-w-6 tw-h-6 tw-text-neutral-900"
          aria-hidden="true"
        />
      </div>

      <div
        v-if="areOptionsOpen"
        ref="comboboxOptionsRef"
        class="combobox__options tw-border tw-border-neutral-300"
      >
        <ul
          :id="`combobox-${label}__options`"
          class="tw-pl-0 tw-flex tw-flex-col gap-2"
          role="listbox"
        >
          <ComboBoxOption
            v-for="option in options"
            :key="option.id ?? option.label"
            class="tw-list-none"
            role="option"
            :option="option"
            :isSelected="isSelected(option)"
            :isHighlighted="isHighlighted(option)"
            @click="() => handleSelectOption(option)"
          />
        </ul>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { ComboBoxOptionType, ComboBoxOption } from ".";
import { onClickOutside } from "@vueuse/core";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";

const props = withDefaults(
  defineProps<{
    label: string;
    options: ComboBoxOptionType[];
    modelValue: ComboBoxOptionType | null;
    placeholder?: string;
    hideLabel?: boolean;
  }>(),
  {
    hideLabel: false,
    modelValue: null,
    options: () => [] as ComboBoxOptionType[],
    placeholder: "Choose...",
  },
);

const emit = defineEmits<{
  (eventName: "update:modelValue", value: ComboBoxOptionType);
}>();

const query = ref("");
const areOptionsOpen = ref(false);
const comboboxContainerRef = ref<HTMLElement | null>(null);
const selectedItemRef = ref<HTMLElement | null>(null);
const comboboxOptionsRef = ref<HTMLElement | null>(null);
const highlightedOptionIndex = ref<number | null>(null);

const highlightedOption = computed(() => {
  if (highlightedOptionIndex.value === null) {
    return null;
  }

  return props.options[highlightedOptionIndex.value];
});

function isHighlighted(option: ComboBoxOptionType) {
  return highlightedOption.value === option;
}

function isSelected(option: ComboBoxOptionType) {
  return props.modelValue === option;
}

function handleSelectOption(option: ComboBoxOptionType) {
  emit("update:modelValue", option);
  areOptionsOpen.value = false;
  reset();
  selectedItemRef.value?.focus();
}

onClickOutside(comboboxContainerRef, () => {
  areOptionsOpen.value = false;
});

function reset() {
  query.value = "";
  highlightedOptionIndex.value = null;
}

function highlightedNextOption() {
  if (highlightedOptionIndex.value === null) {
    highlightedOptionIndex.value = 0;
    return;
  }
  highlightedOptionIndex.value = Math.min(
    highlightedOptionIndex.value + 1,
    props.options.length - 1,
  );
}

function highlightedPreviousOption() {
  if (highlightedOptionIndex.value === null) {
    highlightedOptionIndex.value = props.options.length - 1;
    return;
  }
  highlightedOptionIndex.value = Math.max(highlightedOptionIndex.value - 1, 0);
}

function handleKeyDown(event: KeyboardEvent) {
  const KEYS = {
    ArrowDown: "ArrowDown",
    ArrowUp: "ArrowUp",
    Enter: "Enter",
    Escape: "Escape",
  };

  if (!Object.values(KEYS).includes(event.key)) {
    return;
  }

  event.preventDefault();

  switch (event.key) {
    case "ArrowDown":
      highlightedNextOption();
      break;
    case "ArrowUp":
      highlightedPreviousOption();
      break;
    case "Enter":
      if (highlightedOption.value) {
        handleSelectOption(highlightedOption.value);
      }
      break;
    case "Escape":
      reset();
      break;
  }
}
</script>
<style scoped></style>
