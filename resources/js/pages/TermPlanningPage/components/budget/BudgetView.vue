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
          @select="
            (sectionId) =>
              schedule.dispatch({ type: 'selectedSection', sectionId })
          "
          @editNotes="
            (sectionId, notes) =>
              schedule.dispatch({
                type: 'sectionNotesEdited',
                sectionId,
                notes,
              })
          "
        />

        <RulesTab
          v-else
          :assumptions="assumptions"
          :settings="schedule.costSettings"
          :canEdit="schedule.canEditCosts"
          :teachingEmplids="teachingEmplids"
          @editSetting="
            (key, value) =>
              schedule.dispatch({ type: 'costSettingEdited', key, value })
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
import type { CostAssumptions, EnrollmentHistory } from "@/types";
import BudgetHeader from "./BudgetHeader.vue";
import BudgetTabBar from "./BudgetTabBar.vue";
import RulesTab from "./RulesTab.vue";
import SectionsTable from "./SectionsTable.vue";
import {
  budgetRowOf,
  courseLabelOf,
  jobLabelsOf,
} from "../../helpers/budgetRows";
import {
  enrollmentSeriesBySection,
  historyKeyOf,
} from "../../helpers/enrollmentHistory";
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
}>();

const seriesByKey = computed(() =>
  props.history ? enrollmentSeriesBySection(props.history) : new Map(),
);

const labelOfSection = (sectionId: number) => {
  const section = props.schedule.localSections.find(
    ({ id }) => id === sectionId,
  );
  return section ? courseLabelOf(section) : "another section";
};

const jobLabelOfEmplid = computed(() =>
  props.assumptions ? jobLabelsOf(props.assumptions) : () => "",
);

const teachingEmplids = computed(
  () =>
    new Set(
      props.schedule.localSections.flatMap(({ instructors }) =>
        instructors.map(({ emplid }) => emplid),
      ),
    ),
);

const shownCosts = computed((): SectionCost[] =>
  props.schedule.shownSections.flatMap((section) => {
    const cost = props.schedule.sectionCosts?.get(section.id);
    return cost ? [cost] : [];
  }),
);

const shownTotals = computed(() => totalsOf(shownCosts.value));

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
      jobLabelOfEmplid.value,
    ),
  ),
);
</script>
