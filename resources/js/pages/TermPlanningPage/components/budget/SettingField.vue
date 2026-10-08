<template>
  <div
    class="tw-grid tw-grid-cols-[minmax(0,1fr)_160px] tw-items-center tw-gap-x-4 tw-gap-y-0.5 tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-py-2.5"
  >
    <label :for="inputId" class="tw-m-0 tw-text-[13px] tw-font-semibold">
      {{ setting.label }}
    </label>

    <div class="tw-row-span-2 tw-flex tw-items-center tw-justify-end">
      <input
        v-if="setting.type === 'toggle'"
        :id="inputId"
        type="checkbox"
        :checked="setting.value === true"
        :disabled="!canEdit"
        class="tw-h-4 tw-w-4 tw-accent-brand"
        @change="emit('change', ($event.target as HTMLInputElement).checked)"
      />
      <span
        v-else
        class="tw-flex tw-h-[30px] tw-w-full tw-items-center tw-rounded-md tw-border tw-border-solid tw-px-2 tw-text-on-surface-variant"
        :class="
          isSetForThisFiscalYear
            ? 'tw-border-[#e0a800] tw-bg-accent-container-low'
            : 'tw-border-outline-variant tw-bg-surface-bright'
        "
      >
        <span v-if="setting.type === 'money'" aria-hidden="true">$</span>
        <input
          :id="inputId"
          type="number"
          :value="setting.value"
          v-bind="NUMBER_INPUT_LIMITS[setting.type]"
          :disabled="!canEdit"
          class="tw-w-full tw-border-none tw-bg-transparent tw-text-right tw-text-xs tw-text-on-surface tw-outline-none"
          @input="onNumberInput"
        />
        <span v-if="setting.type === 'percent'" aria-hidden="true">%</span>
      </span>
    </div>

    <p class="tw-m-0 tw-text-[11.5px] tw-text-on-surface-variant">
      {{ setting.description }}
      <span class="tw-ml-1">{{ provenance }}</span>
      <button
        v-if="isSetForThisFiscalYear && canEdit"
        type="button"
        class="tw-ml-1 tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[11.5px] tw-font-semibold tw-text-primary"
        @click="emit('change', null)"
      >
        Clear this year's value
      </button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from "vue";
import type { CostSettingValue } from "@/types";
import { refusalOfSettingValue } from "../../helpers/costSettingValues";
import { fiscalYearLabel } from "../../helpers/fiscalYear";
import { formatWholeDollars } from "../../helpers/money";
import type { LocalCostSetting } from "../../useScheduleEditor/selectors";

const props = defineProps<{
  setting: LocalCostSetting;
  fiscalYear: number;
  canEdit: boolean;
}>();

const emit = defineEmits<{ change: [value: CostSettingValue | null] }>();

const NUMBER_INPUT_LIMITS: Record<
  "money" | "percent" | "count",
  { min: number; max?: number; step: number }
> = {
  money: { min: 0, step: 0.01 },
  percent: { min: 0.01, max: 100, step: 0.01 },
  count: { min: 0, step: 1 },
};

const inputId = useId();

const refusal = ref<string | null>(null);

const isSetForThisFiscalYear = computed(
  () => props.setting.valueFiscalYear === props.fiscalYear,
);

const defaultLabel = computed(() => {
  const { type, default: defaultValue } = props.setting;
  if (type === "toggle") return defaultValue ? "on" : "off";
  if (type === "money") return formatWholeDollars(Number(defaultValue));
  if (type === "percent") return `${defaultValue}%`;
  return String(defaultValue);
});

const provenance = computed(() => {
  if (refusal.value) return `Not saved. ${refusal.value}`;
  if (props.setting.isPending) return "Saving…";

  const { valueFiscalYear } = props.setting;
  if (valueFiscalYear === null) return `Default (${defaultLabel.value}).`;
  if (isSetForThisFiscalYear.value) {
    return `Set for ${fiscalYearLabel(valueFiscalYear)} · default ${defaultLabel.value}.`;
  }
  return `Carried from ${fiscalYearLabel(valueFiscalYear)}.`;
});

function onNumberInput(event: Event) {
  const { type } = props.setting;
  if (type === "toggle") return;

  const raw = (event.target as HTMLInputElement).value;
  const value = Number(raw);
  const isNumber = raw.trim() !== "" && Number.isFinite(value);

  refusal.value = isNumber
    ? refusalOfSettingValue(type, value)
    : "Enter a number.";
  if (refusal.value === null) emit("change", value);
}
</script>
