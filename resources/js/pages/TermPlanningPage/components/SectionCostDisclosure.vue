<template>
  <Disclosure label="Cost" :summary="details.summary">
    <div class="tw-flex tw-flex-col tw-gap-3">
      <div v-for="row in details.rows" :key="row.key" class="tw-text-[13px]">
        <div class="tw-flex tw-items-baseline tw-gap-2">
          <span class="tw-min-w-0 tw-flex-1 tw-truncate">
            {{ row.name
            }}<span v-if="row.isTa" class="tw-text-on-surface-variant">
              · TA</span
            >
          </span>
          <MissingRate v-if="row.amount === null" />
          <span v-else class="tw-font-semibold tw-tabular-nums">
            {{ formatWholeDollars(row.amount) }}
          </span>
        </div>
        <div
          v-if="row.payInputs.length > 0"
          class="tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1"
        >
          <span
            v-for="input in row.payInputs"
            :key="input.field"
            class="tw-flex tw-items-center tw-gap-1.5 tw-text-[11px] tw-text-on-surface-variant"
          >
            {{ PAY_FIELD_LABELS[input.field] }}
            <EditableCell
              class="tw-h-8 tw-w-28 tw-flex-none tw-overflow-hidden tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright"
              :kind="PAY_FIELD_KINDS[input.field]"
              :value="input.value"
              :valueWithoutOverride="input.valueWithoutOverride"
              :isOverridden="input.isOverridden"
              :canEdit="canEdit"
              :label="`${PAY_FIELD_LABELS[input.field]} for ${row.name} on this section`"
              @change="(value) => editPay(input, value)"
            />
          </span>
        </div>
        <p
          v-if="row.unpaidReason"
          class="tw-m-0 tw-mt-1 tw-text-[11px] tw-text-on-surface-variant"
        >
          {{ row.unpaidReason }}
        </p>
      </div>
    </div>
  </Disclosure>
</template>

<script setup lang="ts">
import Disclosure from "./Disclosure.vue";
import EditableCell from "./budget/EditableCell.vue";
import MissingRate from "./budget/MissingRate.vue";
import { formatWholeDollars } from "../helpers/money";
import type {
  SectionCostDetails,
  SectionPayInput,
} from "../helpers/sectionCostRows";
import type { SectionPayField } from "../helpers/sectionPayOverrides";

defineProps<{ details: SectionCostDetails; canEdit: boolean }>();

const emit = defineEmits<{
  editPay: [emplid: number, field: SectionPayField, value: number | null];
}>();

const PAY_FIELD_LABELS: Record<SectionPayField, string> = {
  salary: "Salary",
  fringeRate: "Fringe",
  appointmentPercent: "Appointment",
};

const PAY_FIELD_KINDS = {
  salary: "dollars",
  fringeRate: "percent",
  appointmentPercent: "appointment",
} as const satisfies Record<SectionPayField, string>;

const editPay = ({ emplid, field }: SectionPayInput, value: number | null) =>
  emit("editPay", emplid, field, value);
</script>
