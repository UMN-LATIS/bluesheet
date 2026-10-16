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

        <GradAssistantsTable
          v-else-if="schedule.budgetTab === 'grad'"
          :rows="gradAssistantRows"
          :canEdit="schedule.canEditCosts"
          @selectPerson="selectPerson"
          @selectSection="selectSection"
          @selectLeave="selectLeave"
          @editPersonInput="editPersonInput"
          @editGradPerson="
            (edit) => schedule.dispatch({ type: 'gradPersonEdited', edit })
          "
        />

        <TenureTrackTable
          v-else-if="schedule.budgetTab === 'tenure'"
          v-bind="tenureTrack"
          :canEdit="schedule.canEditCosts"
          @selectPerson="selectPerson"
          @selectSection="selectSection"
          @selectLeave="selectLeave"
          @editPersonInput="editPersonInput"
        />

        <PaContractTable
          v-else-if="schedule.budgetTab === 'pa'"
          v-bind="paContract"
          :canEdit="schedule.canEditCosts"
          @selectPerson="selectPerson"
          @selectSection="selectSection"
          @selectLeave="selectLeave"
          @editPersonInput="editPersonInput"
        />

        <InstructorCostsTable
          v-else-if="schedule.budgetTab === 'costs'"
          v-bind="instructorCosts"
          :canEdit="schedule.canEditCosts"
          @selectPerson="selectPerson"
          @selectLeave="selectLeave"
          @editPersonInput="editPersonInput"
        />

        <template v-else-if="schedule.budgetTab === 'calculator'">
          <GradCalculatorTab
            v-if="gradCalculator"
            :calculator="gradCalculator"
            :scenario="schedule.gradScenario"
            :termName="termName"
            @editGradScenario="
              (change) =>
                schedule.dispatch({ type: 'gradScenarioEdited', change })
            "
          />
          <p
            v-else
            class="tw-m-0 tw-flex-1 tw-p-6 tw-text-sm tw-text-on-surface-variant"
          >
            No grad rates are set for {{ termName }}.
            <AdminRatesLink novaResourceUriKey="grad-term-rates" />
          </p>
        </template>
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
import AdminRatesLink from "./AdminRatesLink.vue";
import BudgetHeader from "./BudgetHeader.vue";
import BudgetTabBar from "./BudgetTabBar.vue";
import GradAssistantsTable from "./GradAssistantsTable.vue";
import GradCalculatorTab from "./GradCalculatorTab.vue";
import InstructorCostsTable from "./InstructorCostsTable.vue";
import PaContractTable from "./PaContractTable.vue";
import SectionsTable from "./SectionsTable.vue";
import TenureTrackTable from "./TenureTrackTable.vue";
import { budgetRowOf } from "../../helpers/budgetRows";
import {
  enrollmentSeriesBySection,
  historyKeyOf,
} from "../../helpers/enrollmentHistory";
import { gradAssistantRowsOf } from "../../helpers/gradAssistantRows";
import { gradCalculatorOf } from "../../helpers/gradCalculatorRows";
import { instructorCostGroupsOf } from "../../helpers/instructorCostRows";
import { jobLabelerOf } from "../../helpers/jobLabel";
import { paContractRowsOf } from "../../helpers/paContractRows";
import { peopleRowsOf } from "../../helpers/peopleRows";
import type { PersonInputEdit } from "../../helpers/personInputs";
import { filterPeople } from "../../helpers/scheduleFilters";
import { tenureTrackRowsOf } from "../../helpers/tenureTrackRows";
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

const selectSection = (sectionId: number) =>
  props.schedule.dispatch({ type: "selectedSection", sectionId });

const selectPerson = (emplid: number) =>
  props.schedule.dispatch({ type: "selectedPerson", emplid });

const selectLeave = (leaveId: number) =>
  props.schedule.dispatch({ type: "selectedLeave", leaveId });

const editPersonInput = (edit: PersonInputEdit) =>
  props.schedule.dispatch({ type: "personInputEdited", edit });

const people = computed(() => {
  const { sectionCosts, rateOverrides } = props.schedule;
  if (!props.assumptions || !sectionCosts || !rateOverrides) {
    return [];
  }

  return filterPeople(
    peopleRowsOf(
      props.schedule.localSections,
      sectionCosts,
      props.assumptions,
      rateOverrides,
      props.roster,
      props.leavesByEmplid,
    ),
    props.schedule.localSections,
    props.schedule.filters,
  );
});

const gradAssistantRows = computed(() =>
  props.assumptions
    ? gradAssistantRowsOf(people.value, props.assumptions.termCode)
    : [],
);

const tenureTrack = computed(() => tenureTrackRowsOf(people.value));

const paContract = computed(() => paContractRowsOf(people.value));

const instructorCosts = computed(() => instructorCostGroupsOf(people.value));

const gradCalculator = computed(() =>
  props.assumptions
    ? gradCalculatorOf(props.assumptions, props.schedule.gradScenario)
    : null,
);

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

const jobLabelOfEmplid = computed(() =>
  props.assumptions ? jobLabelerOf(props.assumptions) : () => null,
);

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
      jobLabelOfEmplid.value,
    ),
  ),
);
</script>
