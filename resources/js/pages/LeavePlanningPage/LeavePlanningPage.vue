<template>
  <FullScreenLayout>
    <template #bar>
      <LeavePlanningToolbar
        :groupId="groupId"
        :terms="terms"
        :range="planning.timelineRange"
        :canShowHistory="canShowHistory"
        :isHistoryShown="planning.isHistoryShown"
        :view="planning.view"
        :activeFilterCount="planning.activeFilterCount"
        :isFilterPanelOpen="isFilterPanelOpen"
        @openFilters="isFilterPanelOpen = true"
        @toggleHistory="planning.toggleHistory"
        @selectView="planning.selectView"
        @selectRangeStart="planning.selectRangeStart"
        @selectRangeEnd="planning.selectRangeEnd"
      />
    </template>

    <div
      class="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-gap-3 tw-px-3 tw-pb-3 roomy:tw-px-4 roomy:tw-pb-4"
    >
      <Pane v-if="isLarge" class="tw-w-[304px] tw-flex-none">
        <PlanningSidebar :planning="planning" />
      </Pane>

      <Pane
        as="section"
        aria-label="Leave timeline"
        class="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col"
      >
        <p
          v-if="unavailableMessage"
          class="tw-m-auto tw-px-6 tw-text-center tw-text-[13px] tw-text-on-surface-variant"
        >
          {{ unavailableMessage }}
        </p>

        <TimelineCanvas
          v-else-if="planning.axis"
          :axis="planning.axis"
          :nameHeading="nameHeading"
          :isHistoryShown="planning.isHistoryShown"
          :groupId="groupId"
          :canViewTermPlanning="canShowHistory"
          :plannedTermIds="planning.plannedTermIds"
          :plannableTermIds="planning.plannableTermIds"
          :trailingScrollRoomPx="trailingScrollRoomPx"
          :today="today"
          :selectionKey="selectionKey"
        >
          <LeaveRows
            v-if="!planning.isHistoryShown"
            :rows="planning.leaveRows"
            :axis="planning.axis"
            :selectedLeaveId="selectedLeaveId"
            :emptyMessage="emptyMessage"
            @selectLeave="planning.selectLeave"
          />
          <CourseHistoryRows
            v-else-if="planning.view === 'courses'"
            :courseHistory="planning.courseHistory"
            :axis="planning.axis"
            :peopleByEmplid="planning.peopleByEmplid"
            :selectedLeaveId="selectedLeaveId"
            :selectedSectionKey="selectedSectionKey"
            :emptyMessage="emptyMessage"
            @selectLeave="planning.selectLeave"
            @selectSection="planning.selectSection"
          />
          <PersonHistoryRows
            v-else
            :rows="planning.personHistoryRows"
            :axis="planning.axis"
            :selectedLeaveId="selectedLeaveId"
            :selectedSectionKey="selectedSectionKey"
            :emptyMessage="emptyMessage"
            @selectLeave="planning.selectLeave"
            @selectSection="planning.selectSection"
          />
        </TimelineCanvas>
      </Pane>

      <PanelMount v-if="isPanelOpen" :panelWidthPx="panelWidthPx">
        <LeavePanel
          v-if="planning.selectedLeave"
          :leave="planning.selectedLeave"
          :person="planning.peopleByEmplid.get(planning.selectedLeave.emplid)"
          :otherLeaves="otherLeavesOfSelected"
          :terms="termsOverlapping(terms, planning.selectedLeave)"
          :groupId="groupId"
          :canViewTermPlanning="canShowHistory"
          @close="planning.deselect"
          @selectLeave="planning.selectLeave"
        />
        <SectionPanel
          v-else-if="planning.selectedSection"
          :section="planning.selectedSection"
          :termName="termNameOf(planning.selectedSection.termId)"
          :groupId="groupId"
          :peopleByEmplid="planning.peopleByEmplid"
          @close="planning.deselect"
        />
      </PanelMount>

      <template v-if="isFilterPanelOpen && !isLarge">
        <div
          class="tw-absolute tw-inset-0 tw-z-40 tw-bg-black/20"
          @click="isFilterPanelOpen = false"
        />
        <Pane
          :class="
            isSmall
              ? 'tw-fixed tw-inset-0 tw-z-50 tw-rounded-none tw-border-0 tw-shadow-none'
              : 'tw-absolute tw-inset-y-0 tw-left-3 tw-z-50 tw-w-[304px] tw-shadow-[18px_0_44px_rgba(38,38,38,0.16)]'
          "
        >
          <PlanningSidebar
            :planning="planning"
            isDismissible
            @close="isFilterPanelOpen = false"
          />
        </Pane>
      </template>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onKeyStroke } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { omit } from "lodash-es";
import dayjs from "dayjs";
import type { PlanningLeave } from "@/types";
import FullScreenLayout from "@/layouts/FullScreenLayout.vue";
import Pane from "@/components/planning/Pane.vue";
import { flattenQuery } from "@/utils/urlQuery";
import { termsOverlapping } from "@/utils/termsOverlapping";
import { useScreenSize } from "@/utils/useScreenSize";
import LeavePlanningToolbar from "./components/LeavePlanningToolbar.vue";
import PlanningSidebar from "./components/PlanningSidebar.vue";
import TimelineCanvas from "./components/TimelineCanvas.vue";
import LeaveRows from "./components/LeaveRows.vue";
import PersonHistoryRows from "./components/PersonHistoryRows.vue";
import CourseHistoryRows from "./components/CourseHistoryRows.vue";
import PanelMount from "./components/PanelMount.vue";
import LeavePanel from "@/components/planning/LeavePanel.vue";
import SectionPanel from "./components/SectionPanel.vue";
import { useLeaveTimelineQuery } from "./queries/useLeaveTimelineQuery";
import { useTeachingHistoryQuery } from "./queries/useTeachingHistoryQuery";
import { useSisTermsQuery } from "./queries/useSisTermsQuery";
import { useCoursePermissionsQuery } from "./queries/useCoursePermissionsQuery";
import { useLeavePlanningView } from "./useLeavePlanningView/useLeavePlanningView";
import { OWNED_QUERY_KEYS } from "./useLeavePlanningView/viewQuery";
import type { Effect, TeachingView } from "./useLeavePlanningView/types";
import { PANEL_CLEARANCE, PANEL_WIDTH } from "./layout";

const props = defineProps<{ groupId: number }>();

const route = useRoute();
const router = useRouter();
const { isLarge, isSmall } = useScreenSize();

const groupId = computed(() => props.groupId);
const today = computed(() => dayjs().format("YYYY-MM-DD"));
const isFilterPanelOpen = ref(false);

const runEffect = (effect: Effect) => {
  switch (effect.type) {
    case "replaceUrlQuery":
      router.replace({
        query: { ...omit(route.query, OWNED_QUERY_KEYS), ...effect.query },
      });
  }
};

const termsQuery = useSisTermsQuery();
const terms = computed(() => termsQuery.data.value ?? []);

const coursePermissionsQuery = useCoursePermissionsQuery(groupId);
const canShowHistory = computed(
  () => coursePermissionsQuery.data.value?.viewAny ?? false,
);
const canPlanTerms = computed(
  () => coursePermissionsQuery.data.value?.create ?? false,
);

// Every read below that sits in a query key must stay off
// `context`: useQuery reads its key during setup, before the
// queries that `context` reads have been declared.
const planning = useLeavePlanningView(
  computed(() => ({
    timeline: timelineQuery.data.value ?? null,
    teachingHistory: teachingHistoryQuery.data.value ?? null,
    terms: terms.value,
    canShowHistory: canShowHistory.value,
    canPlanTerms: canPlanTerms.value,
  })),
  runEffect,
);

watch(
  () => route.query,
  (query) => planning.urlChanged(flattenQuery(query)),
  { immediate: true },
);

const timelineQuery = useLeaveTimelineQuery(
  groupId,
  computed(() => planning.requestedRange.startTermId),
  computed(() => planning.requestedRange.endTermId),
);

const teachingHistoryQuery = useTeachingHistoryQuery(
  groupId,
  computed(() => timelineQuery.data.value?.range ?? null),
  computed(() => planning.isHistoryRequested && canShowHistory.value),
);

onKeyStroke("Escape", () => {
  if (isFilterPanelOpen.value) {
    isFilterPanelOpen.value = false;
    return;
  }
  planning.deselect();
});

const unavailableMessage = computed(() => {
  if (timelineQuery.isPending.value) return "Loading leaves…";
  if (timelineQuery.isError.value) return "Leaves could not be loaded.";
  if (timelineQuery.data.value === null) {
    return "You don’t have permission to view leaves for this department.";
  }
  if (planning.timelineRange === null) {
    return "This group isn’t linked to a department in the SIS.";
  }
  if (termsQuery.isPending.value) return "Loading terms…";
  if (termsQuery.isError.value) return "Terms could not be loaded.";
  if (!planning.axis) return "This range names a term with no dates.";
  if (planning.isHistoryShown && teachingHistoryQuery.isPending.value) {
    return "Loading teaching history…";
  }
  if (planning.isHistoryShown && teachingHistoryQuery.isError.value) {
    return "Teaching history could not be loaded.";
  }
  return null;
});

const VIEW_HEADINGS: Record<TeachingView, string> = {
  instructors: "Instructors",
  tas: "Teaching assistants",
  courses: "Courses",
};

const nameHeading = computed(() => {
  const { shown } = planning.rowCounts;
  if (!planning.isHistoryShown) return `On leave · ${shown}`;
  return `${VIEW_HEADINGS[planning.view]} · ${shown}`;
});

const emptyMessage = computed(() => {
  if (planning.activeFilterCount > 0)
    return "Nothing here matches the filters.";
  if (planning.isHistoryShown) return "No teaching in this range.";
  return "No leaves in this range.";
});

const selectedLeaveId = computed(() =>
  planning.selection?.kind === "leave" ? planning.selection.leaveId : null,
);
const selectedSectionKey = computed(() =>
  planning.selection?.kind === "section" ? planning.selection.sectionKey : null,
);
const selectionKey = computed(() => {
  if (selectedLeaveId.value !== null) return `leave-${selectedLeaveId.value}`;
  if (selectedSectionKey.value !== null) {
    return `section-${selectedSectionKey.value}`;
  }
  return null;
});

const isPanelOpen = computed(
  () => planning.selectedLeave !== null || planning.selectedSection !== null,
);

const panelWidthPx = computed(() =>
  isLarge.value ? PANEL_WIDTH.large : PANEL_WIDTH.medium,
);

const trailingScrollRoomPx = computed(() => {
  if (!isPanelOpen.value || isSmall.value) return 0;
  return panelWidthPx.value + PANEL_CLEARANCE;
});

const otherLeavesOfSelected = computed(() => {
  const selectedLeave = planning.selectedLeave;
  if (!selectedLeave) return [];
  const isOtherLeaveOfSamePerson = (leave: PlanningLeave) =>
    leave.emplid === selectedLeave.emplid && leave.id !== selectedLeave.id;
  return (timelineQuery.data.value?.leaves ?? []).filter(
    isOtherLeaveOfSamePerson,
  );
});

const termNameOf = (termId: number) =>
  terms.value.find(({ id }) => id === termId)?.name ?? String(termId);
</script>
