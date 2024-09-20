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
        class="tw-flex tw-bg-transparent tw-border tw-border-neutral-300 tw-w-full tw-py-3 tw-px-4 tw-items-center tw-justify-between tw-rounded-md"
        @click="handleChangeOption"
      >
        <div class="tw-flex tw-flex-col tw-items-start">
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
          class="tw-border-none tw-bg-transparent tw-block tw-w-full tw-py-3 tw-px-4 tw-text-neutral-900 focus:tw-outline-none"
          :placeholder="placeholder"
          role="combobox"
          :aria-controls="`combobox-${label}__options`"
          aria-autocomplete="list"
          :aria-expanded="areOptionsOpen"
          @keydown="handleKeyDown"
          @focus="areOptionsOpen = true"
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
        class="combobox__options tw-border tw-border-neutral-300 tw-py-3 tw-px-2 tw-max-h-60 tw-overflow-auto tw-bg-white tw-rounded-md tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none tw-relative tw-z-[1000] tw-min-w-[20rem]"
        :style="floatingStyles"
      >
        <ul
          v-if="filteredOptions.length"
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
            @click="() => handleSelectOption(option)"
          />
        </ul>
        <div
          v-else
          class="tw-p-2 tw-text-neutral-500 tw-text-sm tw-text-center"
        >
          None.
        </div>
        <slot name="afterOptions" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { ComboBoxOptionType, ComboBoxOption } from ".";
import { onClickOutside } from "@vueuse/core";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import { first } from "lodash";
import { useFloating, offset } from "@floating-ui/vue";
import Label from "@/components/Label.vue";

const props = withDefaults(
  defineProps<{
    label: string;
    options: ComboBoxOptionType[];
    modelValue: ComboBoxOptionType | null;
    placeholder?: string;
    showLabel?: boolean;
    required?: boolean;
  }>(),
  {
    showLabel: true,
    modelValue: null,
    options: () => [] as ComboBoxOptionType[],
    placeholder: "Choose...",
    required: false,
  },
);

const emit = defineEmits<{
  (eventName: "update:modelValue", value: ComboBoxOptionType);
}>();

const query = ref("");
const areOptionsOpen = ref(false);
const highlightedOption = ref<ComboBoxOptionType | null>(null);

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
  const index = filteredOptions.value.findIndex(
    (option) => option?.id === highlightedOption.value?.id,
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

  return (
    option1.id === option2.id ||
    (option1.label === option2.label &&
      option1.secondaryLabel === option2.secondaryLabel)
  );
}

function isHighlighted(option: ComboBoxOptionType) {
  return areOptionsEqual(option, highlightedOption.value);
}

function isSelected(option: ComboBoxOptionType) {
  return areOptionsEqual(option, props.modelValue);
}

function handleSelectOption(option: ComboBoxOptionType) {
  emit("update:modelValue", option);
  areOptionsOpen.value = false;
  query.value = "";
  highlightedOption.value = null;
  nextTick(() => {
    selectedItemRef.value?.focus();
  });
}

onClickOutside(comboboxContainerRef, () => {
  areOptionsOpen.value = false;
});

function handleChangeOption() {
  // begin with the currently selected option label
  query.value = props.modelValue?.label ?? "";
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

const { floatingStyles } = useFloating(
  comboboxContainerRef,
  comboboxOptionsRef,
  {
    placement: "bottom-start",
    middleware: [offset(10)],
  },
);
</script>
<style scoped></style>
