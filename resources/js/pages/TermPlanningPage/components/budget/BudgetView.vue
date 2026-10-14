<template>
  <div class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
    <p
      v-if="!assumptions"
      class="tw-m-0 tw-flex-1 tw-p-6 tw-text-sm tw-text-on-surface-variant"
    >
      {{ unavailableMessage }}
    </p>

    <template v-else>
      <BudgetHeader
        :totals="shownTotals"
        :termTotals="termTotals"
        :shownCount="schedule.shownSections.length"
        :totalCount="schedule.localSections.length"
        :termName="termName"
      />

      <div
        id="budget-tab-panel"
        role="tabpanel"
        class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col"
      >
        <SectionsTable
          v-if="schedule.budgetTab === 'sections'"
          :rows="rows"
          :totals="shownTotals"
          :selectedSectionId="schedule.selectedSectionId"
          :isReadOnly="schedule.isReadOnly"
          @select="selectSection"
          @editNotes="
            (sectionId, notes) =>
              schedule.dispatch({
                type: 'sectionNotesEdited',
                sectionId,
                notes,
              })
          "
        />

        <InstructorsTable
          v-else-if="schedule.budgetTab === 'instructors'"
          :rows="peopleTables.instructors"
          :canEdit="schedule.canEditCosts"
          @selectSection="selectSection"
          @selectPerson="selectPerson"
          @selectLeave="selectLeave"
          @editSalary="editPersonSalary"
        />

        <TasTable
          v-else-if="schedule.budgetTab === 'tas'"
          :rows="peopleTables.tas"
          :appointmentLevels="appointmentLevels"
          :canEdit="schedule.canEditCosts"
          @selectSection="selectSection"
          @selectPerson="selectPerson"
          @selectLeave="selectLeave"
          @editGradPerson="
            (edit) => schedule.dispatch({ type: 'gradPersonEdited', edit })
          "
        />

        <RatesTab
          v-else-if="schedule.budgetTab === 'rates' && schedule.rateOverrides"
          :assumptions="assumptions"
          :rateOverrides="schedule.rateOverrides"
          :canEdit="schedule.canEditCosts"
          :chargedEmplids="chargedEmplids"
          :termName="termName"
          @editRate="
            (edit) => schedule.dispatch({ type: 'rateOverrideEdited', edit })
          "
        />

        <GradRatesTab
          v-else-if="
            schedule.budgetTab === 'gradRates' && schedule.rateOverrides
          "
          :assumptions="assumptions"
          :rateOverrides="schedule.rateOverrides"
          :canEdit="schedule.canEditCosts"
          :termName="termName"
          @editInput="
            (edit) => schedule.dispatch({ type: 'gradInputEdited', edit })
          "
          @editHours="
            (edit) => schedule.dispatch({ type: 'gradHoursEdited', edit })
          "
        />
      </div>
    </template>

    <BudgetTabBar
      :tab="schedule.budgetTab"
      @select="(tab) => schedule.dispatch({ type: 'budgetTabSelected', tab })"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  CostAssumptions,
  EnrollmentHistory,
  SisEmployee,
  TermLeave,
} from "@/types";
import BudgetHeader from "./BudgetHeader.vue";
import BudgetTabBar from "./BudgetTabBar.vue";
import GradRatesTab from "./GradRatesTab.vue";
import InstructorsTable from "./InstructorsTable.vue";
import RatesTab from "./RatesTab.vue";
import SectionsTable from "./SectionsTable.vue";
import TasTable from "./TasTable.vue";
import { budgetRowOf } from "../../helpers/budgetRows";
import {
  enrollmentSeriesBySection,
  historyKeyOf,
} from "../../helpers/enrollmentHistory";
import { peopleTablesOf } from "../../helpers/peopleRows";
import { totalsOf, type SectionCost } from "../../helpers/termEstimate";
import type { PlannedSection } from "../../types";
import type { ScheduleEditor } from "../../useScheduleEditor";

const props = defineProps<{
  schedule: ScheduleEditor;
  assumptions: CostAssumptions | null;
  isLoadingAssumptions: boolean;
  hasAssumptionsError: boolean;
  /**
   * Null until loaded. Sections then show no history rather
   * than waiting.
   */
  history: EnrollmentHistory | null;
  termName: string;
  roster: SisEmployee[];
  leavesByEmplid: Map<number, TermLeave[]>;
}>();

const seriesByKey = computed(() =>
  props.history ? enrollmentSeriesBySection(props.history) : new Map(),
);

const labelOfSection = (sectionId: number) => {
  const section = props.schedule.localSections.find(
    ({ id }) => id === sectionId,
  );
  return section
    ? `${section.catalogNumber}-${section.section}`
    : "another section";
};

const chargedEmplids = computed(
  () =>
    new Set(
      props.schedule.localSections.flatMap(({ instructors }) =>
        instructors.map(({ emplid }) => emplid),
      ),
    ),
);

const peopleTables = computed(() =>
  props.assumptions &&
  props.schedule.sectionCosts &&
  props.schedule.rateOverrides &&
  props.schedule.personNotes
    ? peopleTablesOf(
        props.schedule.localSections,
        props.schedule.sectionCosts,
        props.assumptions,
        props.schedule.rateOverrides,
        props.roster,
        props.leavesByEmplid,
        props.schedule.personNotes,
      )
    : { instructors: [], tas: [] },
);

const editPersonSalary = (emplid: number, amount: number | null) =>
  props.schedule.dispatch({
    type: "rateOverrideEdited",
    edit: { rate: { kind: "person", emplid }, amount },
  });

const appointmentLevels = computed(() =>
  (props.assumptions?.gradRates.levels ?? [])
    .map(({ appointmentPercent }) => appointmentPercent)
    .sort((a, b) => a - b),
);

const selectLeave = (leaveId: number) =>
  props.schedule.dispatch({ type: "selectedLeave", leaveId });

const selectPerson = (emplid: number) =>
  props.schedule.dispatch({ type: "selectedPerson", emplid });

const selectSection = (sectionId: number) =>
  props.schedule.dispatch({ type: "selectedSection", sectionId });

const shownCosts = computed((): SectionCost[] =>
  props.schedule.shownSections.flatMap((section) => {
    const cost = props.schedule.sectionCosts?.get(section.id);
    return cost ? [cost] : [];
  }),
);

const shownTotals = computed(() => totalsOf(shownCosts.value));

const termTotals = computed(() =>
  totalsOf([...(props.schedule.sectionCosts?.values() ?? [])]),
);

const unavailableMessage = computed(() => {
  if (props.hasAssumptionsError) return "Cost assumptions could not be loaded.";
  if (props.isLoadingAssumptions) return "Loading cost assumptions…";
  return "Cost estimates need a department, and this group has none.";
});

const historyOf = (section: PlannedSection) =>
  seriesByKey.value.get(historyKeyOf(section.courseCode, section.section)) ??
  [];

const rows = computed(() =>
  props.schedule.shownSections.map((section) =>
    budgetRowOf(
      section,
      props.schedule.sectionCosts?.get(section.id),
      historyOf(section),
      labelOfSection,
    ),
  ),
);
</script>
