<template>
  <Combobox
    class="combobox"
    :modelValue="modelValue"
    as="div"
    :nullable="nullable"
    @update:modelValue="(opt) => $emit('update:modelValue', opt)"
  >
    <ComboboxLabel
      v-if="label"
      :class="[
        'tw-block tw-text-xs tw-uppercase tw-text-neutral-500 tw-my-0',
        {
          'tw-sr-only': !showLabel,
          'tw-mb-1': showLabel,
        },
        labelClass,
      ]"
    >
      <Label is="div" :required="required">
        {{ label }}
      </Label>
    </ComboboxLabel>
    <div class="tw-relative">
      <!--
        wrap <ComboboxInput> with <ComboboxButton> so
        that the options automatically open when the input
        is focused
        see: https://github.com/tailwindlabs/headlessui/discussions/1236
      -->
      <ComboboxButton as="div">
        <ComboboxInput
          ref="anchorRef"
          class="combobox__input tw-w-full tw-rounded tw-bg-transparent tw-border-0 tw-py-2 tw-pl-3 tw-pr-10 tw-text-neutral-900 tw-ring-1 tw-ring-inset tw-ring-neutral-300 focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-blue-600 sm:tw-leading-6"
          :class="inputClass"
          :displayValue="(item) => (item as ComboBoxOption | null)?.label ?? ''"
          :placeholder="placeholder"
          @change="query = $event.target.value"
          @keydown.enter="handleAddNewOption(query)"
        />

        <div
          class="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-rounded-r-md tw-px-2 focus:tw-outline-none tw-bg-transparent tw-border-none"
        >
          <ChevronDownIcon
            class="tw-h-5 tw-w-5 tw-text-neutral-400"
            aria-hidden="true"
          />
        </div>
      </ComboboxButton>
      <Teleport to="body">
        <ComboboxOptions
          ref="floatingRef"
          class="tw-absolute tw-z-10 tw-mt-1 tw-max-h-72 tw-w-56 tw-overflow-auto tw-rounded-md tw-bg-white tw-py-1 tw-text-base tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none sm:tw-text-sm tw-pl-0"
          :style="floatingStyles"
        >
          <ComboboxOption
            v-for="option in filteredOptions"
            :key="option.id || option.label"
            v-slot="{ active, selected }"
            :value="option"
            as="template"
          >
            <li
              :class="[
                'tw-relative tw-cursor-default tw-select-none tw-py-2 tw-pl-8 tw-pr-4 tw-list-none',
                active ? 'tw-bg-blue-600 tw-text-white' : 'tw-text-neutral-900',
                selected && !active && 'tw-bg-blue-100',
              ]"
            >
              <div class="tw-flex tw-flex-col">
                <div :class="['tw-block', selected && 'tw-font-semibold']">
                  {{ option.label }}
                </div>
                <div
                  v-if="option.secondaryLabel"
                  :class="[
                    'tw-text-xs',
                    active ? 'tw-text-white/75' : 'tw-text-neutral-400',
                    selected && 'tw-font-semibold',
                  ]"
                >
                  {{ option.secondaryLabel }}
                </div>
              </div>

              <span
                v-if="selected"
                :class="[
                  'tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-1.5',
                  active ? 'tw-text-white' : 'tw-text-blue-600',
                ]"
              >
                <CheckIcon class="tw-h-5 tw-w-5" aria-hidden="true" />
              </span>
            </li>
          </ComboboxOption>
          <div class="tw-mx-4 tw-my-2 tw-flex tw-flex-col tw-gap-2">
            <div
              v-if="!filteredOptions.length"
              class="tw-text-center tw-italic tw-text-neutral-500"
            >
              No results found
            </div>
            <button
              v-if="canAddNewOption"
              type="button"
              :disabled="!isNewOption"
              class="combobox__add-new-option-button tw-block tw-w-full tw-mt-2 tw-py-2 tw-px-4 tw-border tw-border-transparent tw-rounded tw-shadow-sm tw-text-sm tw-font-medium tw-text-white tw-bg-neutral-700 hover:tw-bg-neutral-900 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-blue-500 disabled:tw-opacity-25 hover:disabled:tw-bg-neutral-700 disabled:tw-cursor-not-allowed"
              @click="handleAddNewOption(query)"
            >
              Add New Option
            </button>
          </div>
        </ComboboxOptions>
      </Teleport>
    </div>
  </Combobox>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CheckIcon, ChevronDownIcon } from "@/icons";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxLabel,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/vue";
import { CSSClass } from "@/types";
import Label from "./Label.vue";
import { useFloating, offset, autoPlacement } from "@floating-ui/vue";

export interface ComboBoxOption {
  id?: string | number; // new options might have an undefined id
  label: string;
  secondaryLabel?: string;
}

const props = withDefaults(
  defineProps<{
    label?: string;
    options: ComboBoxOption[];
    modelValue: ComboBoxOption | null;
    labelClass?: CSSClass;
    inputClass?: CSSClass;
    showLabel?: boolean;
    required?: boolean;
    canAddNewOption?: boolean;
    nullable?: boolean; // can be cleared after selected
    placeholder?: string;
  }>(),
  {
    label: "",
    labelClass: "",
    inputClass: "",
    showLabel: true,
    required: false,
    canAddNewOption: false,
    nullable: false,
    placeholder: "",
  },
);

const emit = defineEmits<{
  (eventName: "update:modelValue", value: ComboBoxOption | null);
  (eventName: "addNewOption", value: ComboBoxOption);
}>();

const query = ref("");
const filteredOptions = computed(() =>
  query.value === ""
    ? props.options
    : props.options.filter((opt) => {
        return (
          opt.label.toLowerCase().includes(query.value.toLowerCase()) ||
          opt.secondaryLabel?.toLowerCase().includes(query.value.toLowerCase())
        );
      }),
);

const isNewOption = computed(() => {
  return !props.options.find((option) => option.label === query.value);
});

function handleAddNewOption(newOptionLabel: string) {
  if (!props.canAddNewOption) {
    return;
  }

  // check that the option is not already in the list
  // if it is, then select it
  const existingOption = props.options.find(
    (option) => option.label === newOptionLabel,
  );

  if (existingOption) {
    emit("update:modelValue", existingOption);
    return;
  }

  // otherwise add it to the list
  const newOption: ComboBoxOption = {
    label: query.value,
  };
  emit("addNewOption", newOption);
  emit("update:modelValue", newOption);
}

const anchorRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);

const { floatingStyles } = useFloating(anchorRef, floatingRef, {
  middleware: [offset(10), autoPlacement()],
});
</script>
