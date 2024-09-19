<template>
  <div class="combobox-w-label">
    <label
      :for="`combobox-${label}__input`"
      :class="{
        'tw-sr-only': hideLabel,
      }"
      >{{ label }}</label
    >
    <div ref="comboboxContainerRef" class="tw-cursor-pointer">
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
          @keydown="handleKeyDown"
        />
        <button
          class="tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-none tw-p-2 tw-rounded-md"
          @click="areOptionsOpen = !areOptionsOpen"
        >
          <ChevronDownIcon
            class="tw-w-6 tw-h-6 tw-text-neutral-900"
            aria-hidden="true"
          />
        </button>
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
            v-for="option in filteredOptions"
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
import { first } from "lodash";

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
const highlightedOption = ref<ComboBoxOptionType | null>(null);

const filteredOptions = computed(() => {
  const lcQuery = query.value.toLowerCase();
  return props.options.filter(
    (option) =>
      option.label.toLowerCase().includes(lcQuery) ||
      option.secondaryLabel?.toLowerCase().includes(lcQuery),
  );
});

const indexOfHighlightedOption = computed(() => {
  const index = filteredOptions.value.findIndex(
    (option) => option?.id === highlightedOption.value?.id,
  );
  return index === -1 ? null : index;
});

function isHighlighted(option: ComboBoxOptionType) {
  return highlightedOption.value?.id === option.id;
}

function isSelected(option: ComboBoxOptionType) {
  return props.modelValue === option;
}

function handleSelectOption(option: ComboBoxOptionType) {
  emit("update:modelValue", option);
  areOptionsOpen.value = false;
  query.value = "";
  highlightedOption.value = null;
  selectedItemRef.value?.focus();
}

onClickOutside(comboboxContainerRef, () => {
  areOptionsOpen.value = false;
});

function highlightNextOption() {
  if (
    highlightedOption.value === null ||
    indexOfHighlightedOption.value === null
  ) {
    highlightedOption.value = first(filteredOptions.value) ?? null;
    console.log(highlightedOption.value);
    return;
  }

  const nextIndex = Math.min(
    indexOfHighlightedOption.value + 1,
    filteredOptions.value.length - 1,
  );

  highlightedOption.value = filteredOptions.value[nextIndex];
}

function highlightPrevOption() {
  if (
    highlightedOption.value === null ||
    indexOfHighlightedOption.value === null
  ) {
    highlightedOption.value = first(filteredOptions.value) ?? null;
    return;
  }

  const prevIndex = Math.max(indexOfHighlightedOption.value - 1, 0);
  highlightedOption.value = filteredOptions.value[prevIndex];
}

function handleKeyDown(event: KeyboardEvent) {
  const KEYS = {
    ArrowDown: "ArrowDown",
    ArrowUp: "ArrowUp",
    Enter: "Enter",
    Escape: "Escape",
  };

  // open options
  areOptionsOpen.value = true;

  if (!Object.values(KEYS).includes(event.key)) {
    return;
  }

  event.preventDefault();

  switch (event.key) {
    case "ArrowDown":
      highlightNextOption();
      break;
    case "ArrowUp":
      highlightPrevOption();
      break;
    case "Enter":
      if (highlightedOption.value) {
        handleSelectOption(highlightedOption.value);
      }
      break;
    case "Escape":
      query.value = "";
      highlightedOption.value = null;
      areOptionsOpen.value = false;
      break;
  }
}
</script>
<style scoped></style>
