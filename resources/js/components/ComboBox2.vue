<template>
  <Combobox v-model="selectedOption" as="div">
    <ComboboxLabel
      :class="[
        'tw-block tw-text-xs tw-uppercase tw-text-neutral-500 tw-mb-1',
        {
          'tw-sr-only': !showLabel,
        },
        labelClass,
      ]"
    >
      {{ label }}
      <span v-if="required" class="tw-text-red-600">*</span>
    </ComboboxLabel>
    <div class="tw-relative">
      <ComboboxInput
        class="tw-w-full tw-rounded-md tw-border-0 tw-bg-white tw-py-1.5 tw-pl-3 tw-pr-10 tw-text-gray-900 tw-ring-1 tw-ring-inset tw-ring-gray-300 focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-blue-600 sm:tw-text-sm sm:tw-leading-6"
        :displayValue="(item) => (item as ComboBoxOption | null)?.label ?? ''"
        @change="query = $event.target.value"
      />
      <ComboboxButton
        class="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-rounded-r-md tw-px-2 focus:tw-outline-none tw-bg-transparent tw-border-none"
      >
        <ChevronUpDownIcon
          class="tw-h-5 tw-w-5 tw-text-gray-400"
          aria-hidden="true"
        />
      </ComboboxButton>
      <Transition name="fade-slide">
        <ComboboxOptions
          v-if="filteredOptions.length"
          class="tw-absolute tw-z-10 tw-mt-1 tw-max-h-60 tw-w-full tw-overflow-auto tw-rounded-md tw-bg-white tw-py-1 tw-text-base tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none sm:tw-text-sm tw-pl-0"
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
                active ? 'tw-bg-blue-600 tw-text-white' : 'tw-text-gray-900',
                selected && !active && 'tw-bg-blue-100',
              ]"
            >
              <div class="tw-flex tw-flex-col tw-gap-2">
                <div
                  :class="[
                    'tw-block tw-truncate',
                    selected && 'tw-font-semibold',
                  ]"
                >
                  {{ option.label }}
                </div>
                <div
                  v-if="option.secondaryLabel"
                  :class="[
                    'tw-text-xs tw-truncate',
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
        </ComboboxOptions>
      </Transition>
    </div>
  </Combobox>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CheckIcon, ChevronUpDownIcon } from "@/icons";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxLabel,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/vue";
import { CSSClass } from "@/types";

export interface ComboBoxOption {
  id?: string | number; // new options might have an undefined id
  label: string;
  secondaryLabel?: string;
}

const props = withDefaults(
  defineProps<{
    label: string;
    options: ComboBoxOption[];
    modelValue: ComboBoxOption | null;
    labelClass?: CSSClass;
    showLabel?: boolean;
    required?: boolean;
  }>(),
  {
    labelClass: "",
    showLabel: false,
    required: false,
  },
);

const emits = defineEmits<{
  (eventName: "update:modelValue", value: ComboBoxOption | null);
}>();

const query = ref("");
const selectedOption = ref<ComboBoxOption | null>(null);
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
</script>
