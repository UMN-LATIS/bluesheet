<template>
  <div class="combobox tw-max-w-[20rem]">
    <Label
      :for="`combobox-${label}__input`"
      :class="{
        'tw-sr-only': !showLabel,
      }"
      :required="required"
      >{{ label }}</Label
    >
    <div ref="comboboxContainerRef" class="tw-cursor-pointer">
      <button
        v-if="modelValue && !areOptionsOpen"
        ref="selectedItemRef"
        class="tw-flex tw-bg-transparent tw-border tw-border-neutral-300 tw-w-full tw-py-3 tw-px-4 tw-items-center tw-justify-between tw-rounded-md tw-text-left"
        @click="handleChangeOption"
      >
        <div class="tw-flex tw-flex-col tw-items-start tw-flex-1">
          <span class="tw-text-sm">{{ modelValue.label }}</span>
          <span
            v-if="modelValue.secondaryLabel"
            class="tw-text-neutral-500 tw-text-xs"
          >
            {{ modelValue.secondaryLabel }}
          </span>
        </div>
        <ChevronDownIcon
          class="tw-w-6 tw-h-6 tw-text-neutral-900"
          aria-hidden="true"
        />
      </button>
      <div
        v-else
        class="tw-flex tw-bg-transparent tw-border tw-border-neutral-300 tw-w-full tw-items-center tw-justify-between tw-rounded-md focus-within:tw-ring-2 focus-within:tw-ring-blue-500"
      >
        <input
          :id="`combobox-${label}__input`"
          ref="comboboxInputRef"
          v-model="query"
          type="search"
          class="tw-border-none tw-bg-transparent tw-block tw-w-full tw-py-3 tw-pl-4 tw-text-neutral-900 focus:tw-outline-none tw-text-sm flex-1"
          :placeholder="placeholder"
          role="combobox"
          :aria-controls="`combobox-${label}__options`"
          aria-autocomplete="list"
          :aria-expanded="areOptionsOpen"
          @keydown="handleKeyDown"
          @focus="areOptionsOpen = true"
        />
        <button
          class="tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-none tw-p-2 tw-mr-2 tw-rounded-md"
          @click="areOptionsOpen = !areOptionsOpen"
        >
          <ChevronDownIcon
            class="tw-w-6 tw-h-6 tw-text-neutral-900"
            aria-hidden="true"
          />
        </button>
      </div>

      <MaybeTeleport :teleportTo="teleportTo">
        <div
          v-if="areOptionsOpen"
          ref="comboboxOptionsRef"
          class="combobox__options tw-border tw-border-neutral-300 tw-py-3 tw-px-2 tw-max-h-60 tw-overflow-auto tw-bg-white tw-rounded-md tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none tw-relative tw-z-[1000] tw-min-w-[20rem]"
          :style="floatingStyles"
        >
        <div class="tw-flex tw-justify-end">
          <button
            type="button"
            class="tw-p-1 tw-text-neutral-400 hover:tw-text-neutral-600 tw-bg-transparent tw-border-none tw-cursor-pointer tw-rounded"
            aria-label="Close options dropdown"
            title="Close options dropdown"
            @click="closeComboBoxOptions"
          >
            <XIcon />
          </button>
        </div>
          <div v-if="!options.length">
            <p class="tw-text-sm tw-text-neutral-500 tw-text-center">
              No options.
            </p>
          </div>
          <ul
            v-else-if="filteredOptions.length"
            :id="`combobox-${label}__options`"
            class="tw-pl-0 tw-flex tw-flex-col gap-2"
            role="listbox"
          >
            <ComboBoxOption
              v-for="option in filteredOptions"
              :key="option.id ?? option.label"
              role="option"
              :option="option"
              :isSelected="isSelected(option)"
              :isHighlighted="isHighlighted(option)"
              :data-highlighted-option="isHighlighted(option)"
              @click="() => handleSelectOption(option)"
            />
          </ul>
          <div
            v-else
            class="tw-p-2 tw-text-neutral-500 tw-text-center"
          >
            <p class="tw-text-sm tw-mb-1">No matches found.</p>
            <p class="tw-text-sm">
              <Button
              v-if="query"
              variant="link"
              type="button"
              class="tw-inline-block"
              @click="query = ''"
            >
              Clear
            </Button>
            to see all options.</p>
          </div>
          <div
            v-if="canAddNewOptions"
            class="tw-mt-3 tw-pt-3 tw-border-t tw-border-neutral-200"
          >
            <div class="tw-flex tw-gap-2 tw-items-center">
              <input
                v-model="newOptionValue"
                type="text"
                placeholder="Add new option..."
                class="tw-flex-1 tw-px-3 tw-py-2 tw-border tw-border-neutral-300 tw-rounded-md tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                @keydown.enter="handleAddNewOptionsClick"
              />
              <button
                class="tw-flex tw-items-center tw-justify-center tw-w-9 tw-h-9 tw-bg-bs-blue tw-text-white tw-rounded-md hover:tw-bg-blue-600 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed"
                :disabled="!newOptionValue"
                aria-label="Add new option"
                title="Add new option"
                @click="handleAddNewOptionsClick"
              >
                <CheckIcon aria-hidden="true" />
              </button>
            </div>
          </div>
          <slot name="afterOptions" :query="query" />
        </div>
      </MaybeTeleport>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { ComboBoxOptionType, ComboBoxOption } from ".";
import { onClickOutside } from "@vueuse/core";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import CheckIcon from "@/icons/CheckIcon.vue";
import XIcon from "@/icons/XIcon.vue";
import { first } from "lodash";
import {
  useFloating,
  offset,
  autoPlacement as autoPlacementFn,
  autoUpdate,
} from "@floating-ui/vue";
import Label from "@/components/Label.vue";
import MaybeTeleport from "@/components/MaybeTeleport.vue";
import Button from "../Button.vue";

const props = withDefaults(
  defineProps<{
    label: string;
    options: ComboBoxOptionType[];
    modelValue: ComboBoxOptionType | null;
    placeholder?: string;
    showLabel?: boolean;
    required?: boolean;
    strategy?: "absolute" | "fixed";
    teleportTo?: string;
    autoPlacement?: boolean;
    canAddNewOptions?: boolean;
  }>(),
  {
    showLabel: true,
    modelValue: null,
    options: () => [] as ComboBoxOptionType[],
    placeholder: "Choose...",
    required: false,
    strategy: "absolute",
    teleportTo: undefined,
    autoPlacement: false,
    canAddNewOptions: false,
  },
);

const emit = defineEmits<{
  (eventName: "update:modelValue", value: ComboBoxOptionType);
  (eventName: "addNewOption", value: ComboBoxOptionType);
}>();

const query = ref("");
const areOptionsOpen = ref(false);
const highlightedOption = ref<ComboBoxOptionType | null>(null);
const newOptionValue = ref("");

const comboboxContainerRef = ref<HTMLElement | null>(null);
const selectedItemRef = ref<HTMLElement | null>(null);
const comboboxInputRef = ref<HTMLInputElement | null>(null);
const comboboxOptionsRef = ref<HTMLElement | null>(null);

const filteredOptions = computed(() => {
  const lcQuery = query.value.toLowerCase();
  return props.options.filter(
    (option) =>
      option.label.toLowerCase().includes(lcQuery) ||
      option.secondaryLabel?.toLowerCase().includes(lcQuery),
  );
});

const indexOfHighlightedOption = computed(() => {
  const index = filteredOptions.value.findIndex((option) =>
    areOptionsEqual(option, highlightedOption.value),
  );
  return index === -1 ? null : index;
});

function areOptionsEqual(
  option1: ComboBoxOptionType | null,
  option2: ComboBoxOptionType | null,
) {
  if (!option1 || !option2) {
    return false;
  }

  // use ids if they both exist otherwise use labels
  const areEqual =
    option1.id && option2.id
      ? option1.id === option2.id
      : option1.label === option2.label;
  return areEqual;
}

function isHighlighted(option: ComboBoxOptionType) {
  return areOptionsEqual(option, highlightedOption.value);
}

function isSelected(option: ComboBoxOptionType) {
  return areOptionsEqual(option, props.modelValue);
}

function handleSelectOption(option: ComboBoxOptionType) {
  emit("update:modelValue", option);
  closeComboBoxOptions();
  nextTick(() => {
    selectedItemRef.value?.focus();
  });
}

onClickOutside(comboboxContainerRef, () => {
  closeComboBoxOptions();
});

function handleChangeOption() {
  // Clear the query to show all options when editing
  query.value = "";
  highlightedOption.value = props.modelValue;
  areOptionsOpen.value = !areOptionsOpen.value;
  nextTick(() => {
    comboboxInputRef.value?.focus();
  });
}

function highlightNextOption() {
  if (
    highlightedOption.value === null ||
    indexOfHighlightedOption.value === null
  ) {
    highlightedOption.value = first(filteredOptions.value) ?? null;
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

function closeComboBoxOptions() {
  query.value = "";
  highlightedOption.value = null;
  areOptionsOpen.value = false;
}

function handleAddNewOptionsClick() {
  if (!newOptionValue.value) {
    return;
  }

  // check if the option already exists
  const existingOption = props.options.find(
    (option) => option.label === newOptionValue.value,
  );

  if (existingOption) {
    handleSelectOption(existingOption);
    newOptionValue.value = "";
    return;
  }

  // if it doesn't exist, add it as a new option
  const newOption: ComboBoxOptionType = {
    label: newOptionValue.value,
  };

  emit("addNewOption", newOption);
  handleSelectOption(newOption);
  newOptionValue.value = "";
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
      } else if (filteredOptions.value.length === 1) {
        // if there's only one option, select it
        handleSelectOption(filteredOptions.value[0]);
      } else if (props.canAddNewOptions) {
        handleAddNewOptionsClick();
      }
      break;
    case "Escape":
      closeComboBoxOptions();
      break;
  }
}

watch(query, () => {
  if (!props.modelValue) {
    highlightedOption.value = first(filteredOptions.value) ?? null;
  }

  // if the current selected item is in the filtered options,
  // use it as the default highlighted option
  const isModelValueInFilteredOptions = filteredOptions.value.some((option) =>
    areOptionsEqual(option, props.modelValue),
  );

  highlightedOption.value = isModelValueInFilteredOptions
    ? props.modelValue
    : first(filteredOptions.value) ?? null;
});

const { floatingStyles } = useFloating(
  comboboxContainerRef,
  comboboxOptionsRef,
  {
    placement: "bottom-start",
    middleware: [
      offset(10),
      ...(props.autoPlacement ? [autoPlacementFn()] : []),
    ],
    strategy: props.strategy,
    whileElementsMounted: autoUpdate,
  },
);
</script>
<style scoped></style>
