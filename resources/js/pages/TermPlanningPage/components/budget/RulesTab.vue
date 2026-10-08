<template>
  <div
    class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-6 tw-overflow-auto tw-px-[18px] tw-py-4"
  >
    <section>
      <CapsLabel class="tw-mb-2 tw-block">
        Job codes of this term's instructors · per course ·
        {{ fiscalYearLabel(assumptions.fiscalYear) }} · entered by app admins
      </CapsLabel>
      <div
        class="tw-grid tw-grid-cols-[64px_minmax(0,1.4fr)_minmax(0,1.2fr)_110px_minmax(0,1.6fr)] [&>*]:tw-py-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-outline tw-text-xs"
      >
        <template v-for="row in jobCodeRows" :key="row.code">
          <BudgetCell :hasRightBorder="false" class="tw-font-semibold">{{
            row.code
          }}</BudgetCell>
          <BudgetCell :hasRightBorder="false">{{ row.title }}</BudgetCell>
          <BudgetCell
            :hasRightBorder="false"
            class="tw-text-on-surface-variant"
            >{{ row.instructorTypeLabel }}</BudgetCell
          >
          <BudgetCell
            :hasRightBorder="false"
            align="end"
            class="tw-font-semibold"
          >
            <span
              v-if="row.isPricedPerAppointment"
              class="tw-whitespace-nowrap tw-font-normal tw-text-on-surface-variant"
            >
              Per appointment
            </span>
            <MissingRate v-else-if="row.costPerCourse === null" />
            <template v-else>{{
              formatWholeDollars(row.costPerCourse)
            }}</template>
          </BudgetCell>
          <BudgetCell
            :hasRightBorder="false"
            class="tw-text-[11.5px] tw-text-on-surface-variant"
            >{{ row.note }}</BudgetCell
          >
        </template>
      </div>
    </section>

    <section class="tw-max-w-[620px]">
      <CapsLabel class="tw-mb-2 tw-block">
        TA appointments · {{ assumptions.season }} · salary + fringe per term
        <template v-if="assumptions.taRates.fiscalYear !== null">
          · {{ fiscalYearLabel(assumptions.taRates.fiscalYear) }}
        </template>
      </CapsLabel>
      <p
        v-if="seasonTaRates.length === 0"
        class="tw-m-0 tw-text-[11.5px] tw-text-on-surface-variant"
      >
        No TA rates are entered for {{ assumptions.season }} at or before
        {{ fiscalYearLabel(assumptions.fiscalYear) }}. TA lines show "No rate".
      </p>
      <div
        v-else
        class="tw-grid tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px] [&>*]:tw-py-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-outline tw-text-xs"
      >
        <template
          v-for="rate in seasonTaRates"
          :key="`${rate.studentStatus}-${rate.appointmentPercent}`"
        >
          <BudgetCell :hasRightBorder="false" class="tw-font-semibold"
            >{{ rate.appointmentPercent }}% appointment</BudgetCell
          >
          <BudgetCell
            :hasRightBorder="false"
            class="tw-text-on-surface-variant"
          >
            {{
              rate.studentStatus === "abd" ? "ABD student" : "Regular student"
            }}
          </BudgetCell>
          <BudgetCell
            :hasRightBorder="false"
            align="end"
            class="tw-font-semibold"
          >
            {{ formatWholeDollars(rate.costPerTerm) }}
          </BudgetCell>
        </template>
      </div>
    </section>

    <section class="tw-max-w-[760px]">
      <CapsLabel class="tw-mb-1 tw-block">
        Assumptions · {{ fiscalYearLabel(assumptions.fiscalYear) }} · this
        department
      </CapsLabel>
      <SettingField
        v-for="setting in settings"
        :key="setting.key"
        :setting="setting"
        :fiscalYear="assumptions.fiscalYear"
        :canEdit="canEdit"
        @change="(value) => emit('editSetting', setting.key, value)"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CostAssumptions, CostSettingValue } from "@/types";
import BudgetCell from "./BudgetCell.vue";
import CapsLabel from "./CapsLabel.vue";
import MissingRate from "./MissingRate.vue";
import SettingField from "./SettingField.vue";
import { fiscalYearLabel } from "../../helpers/fiscalYear";
import { jobCodeRowsOf } from "../../helpers/jobCodeRows";
import { formatWholeDollars } from "../../helpers/money";
import type { LocalCostSetting } from "../../useScheduleEditor/selectors";

const props = defineProps<{
  assumptions: CostAssumptions;
  settings: LocalCostSetting[];
  canEdit: boolean;
  teachingEmplids: Set<number>;
}>();

const emit = defineEmits<{
  editSetting: [key: string, value: CostSettingValue | null];
}>();

const jobCodeRows = computed(() =>
  jobCodeRowsOf(props.assumptions, props.teachingEmplids),
);

const seasonTaRates = computed(() =>
  props.assumptions.taRates.rates.filter(
    ({ season }) => season === props.assumptions.season,
  ),
);
</script>
