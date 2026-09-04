<template>
  <FullScreenLayout>
    <template #bar>
      <PlanningToolbar
        :groupId="groupId"
        :termCode="termCode"
        :term="term"
        :termOptions="termOptions"
        :today="today"
        :view="activeView"
        :isReadOnly="isReadOnly"
        :activeFilterCount="schedule.activeFilterCount"
        :isFilterPanelOpen="isFilterPanelOpen"
        @selectView="schedule.selectView"
        @openFilters="isFilterPanelOpen = true"
      />
    </template>

    <!--
      The panes float as cards on the recessed page. `relative` is what the
      two overlaid panels are positioned against, so they cover the canvas
      and not the bar above it.
    -->
    <div
      class="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-gap-3 tw-px-3 tw-pb-3 roomy:tw-px-4 roomy:tw-pb-4"
    >
      <Pane v-if="isLarge" class="tw-w-[304px] tw-flex-none">
        <ScheduleSidebar
          :options="filterOptions"
          :schedule="schedule"
          :reachable="reachableValues"
          :unofficialCourseCodes="unofficialCourseCodes"
        />
      </Pane>

      <Pane
        as="section"
        :aria-label="`${VIEW_LABELS[activeView]} schedule`"
        class="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col"
      >
        <DayView
          v-if="activeView === 'day'"
          :dayIndex="schedule.dayIndex"
          :meetings="schedule.meetings"
          :sectionOf="sectionOf"
          :unscheduled="placed.unscheduled"
          :unofficialCourseCodes="unofficialCourseCodes"
          :counts="dayCounts"
          :schedule="schedule"
          :size="size"
          @selectDay="schedule.selectDay"
        />

        <div
          v-else-if="activeView === 'week'"
          class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-auto tw-bg-surface-bright"
        >
          <ScheduleGrid
            :schedule="schedule"
            :componentOf="componentOf"
            :isUnofficial="isUnofficialBlock"
            :unofficialCourseCodes="unofficialCourseCodes"
            :unscheduled="placed.unscheduled"
            :selectedSectionId="selectedSection?.id ?? null"
          >
            <template #block="{ meeting }">
              <SectionBlock
                v-if="sectionOf(meeting.id)"
                :section="sectionOf(meeting.id)!"
                :isEdited="schedule.hasEdits(sectionOf(meeting.id)!.id)"
                :isUnofficial="isUnofficialBlock(meeting)"
                :startMinute="meeting.startMinute"
                :endMinute="meeting.endMinute"
              />
              <MeetingTimes
                v-else
                :startMinute="meeting.startMinute"
                :endMinute="meeting.endMinute"
              />
            </template>
          </ScheduleGrid>
        </div>

        <div
          v-else
          class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-auto tw-bg-surface-bright"
        >
          <CoverageHeatmap
            :meetings="schedule.meetings"
            :dayNames="WEEKDAY_NAMES"
            :asyncCount="placed.unscheduled.length"
            :schedule="schedule"
            @showAsync="schedule.showAsyncDay"
          />
        </div>
      </Pane>

      <SheetMount v-if="schedule.openHour || selectedSection">
        <HourSheet
          v-if="schedule.openHour"
          :dayIndex="schedule.openHour.dayIndex"
          :dayName="WEEKDAY_NAMES[schedule.openHour.dayIndex]"
          :startMinute="schedule.openHour.startMinute"
          :entries="hourEntries"
          :schedule="schedule"
          @close="schedule.deselect"
          @showInWeek="schedule.selectView('week')"
        />
        <SectionSheet
          v-else-if="selectedSection"
          :section="selectedSection"
          :schedule="schedule"
          :groupId="groupId"
          :isUnofficial="isUnofficialSection(selectedSection)"
          :sections="localSections"
          :roster="roster"
          :returnTo="returnTo"
          :termName="term?.name"
          :isReadOnly="isReadOnly"
          @back="goBackToHour"
          @close="closeSheet"
          @create="createDrawnSection"
          @discard="schedule.discardNewSection"
          @delete="deleteSelectedSection"
        />
      </SheetMount>

      <!-- Summoned, so it closes again; a click on the canvas behind it is
           how a panel opened by mistake gets out of the way. -->
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
          <ScheduleSidebar
            :options="filterOptions"
            :schedule="schedule"
            :reachable="reachableValues"
            :unofficialCourseCodes="unofficialCourseCodes"
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
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { useEventListener } from "@vueuse/core";
import { omit } from "lodash-es";
import FullScreenLayout from "@/layouts/FullScreenLayout.vue";
import CoverageHeatmap from "./components/CoverageHeatmap.vue";
import DayView from "./components/DayView.vue";
import HourSheet, { type HourEntry } from "./components/HourSheet.vue";
import MeetingTimes from "./components/MeetingTimes.vue";
import Pane from "./components/Pane.vue";
import PlanningToolbar from "./components/PlanningToolbar.vue";
import ScheduleGrid from "./components/ScheduleGrid.vue";
import ScheduleSidebar from "./components/ScheduleSidebar.vue";
import SectionBlock from "./components/SectionBlock.vue";
import SectionSheet from "./components/SectionSheet.vue";
import SheetMount from "./components/SheetMount.vue";
import { bandsForDay } from "./helpers/dayBands";
import { buildFilterOptions } from "./helpers/filterOptions";
import { reachableFacetValues } from "./helpers/scheduleFilters";
import { ASYNC_DAY_INDEX, WEEKDAY_NAMES } from "./helpers/scheduleDays";
import { formatTimeRange } from "./helpers/timeScale";
import { toSectionPayload } from "./helpers/sectionPayload";
import { flattenQuery } from "./helpers/urlQuery";
import type { ScheduleView } from "./helpers/viewQuery";
import { useTermPlanCoursesQuery } from "./queries/useTermPlanCoursesQuery";
import { useTermPlanMutations } from "./queries/useTermPlanMutations";
import { useTermPlanAutosave } from "./useTermPlanAutosave";
import type { Meeting, PlannedSection } from "./types";
import { useScheduleEditor } from "./useScheduleEditor";
import { NEW_SECTION_ID } from "./useScheduleEditor/types";
import type { Effect } from "./useScheduleEditor/types";
import { EDITOR_QUERY_KEYS } from "./useScheduleEditor/update";
import { useScreenSize } from "./useScreenSize";
import { useTermSchedule } from "./useTermSchedule";

const props = defineProps<{
  groupId: number;
  termCode: number | null;
}>();

const route = useRoute();
const router = useRouter();

/**
 * Reactive, not a plain `props.groupId`: switching department keeps this
 * component mounted, so a query keyed on the value it opened with would go on
 * showing the department the reader just left.
 */
const groupId = computed(() => props.groupId);
const termCode = computed(() => props.termCode);

const { size, isLarge, isSmall } = useScreenSize();

const VIEW_LABELS: Record<ScheduleView, string> = {
  day: "Day",
  week: "Week",
  heatmap: "Coverage",
};

const isFilterPanelOpen = ref(false);

// A panel summoned on a narrow screen has no business staying open once the
// window is wide enough to dock it.
watch(isLarge, (isDocked) => {
  if (isDocked) isFilterPanelOpen.value = false;
});

const {
  today,
  term,
  activeTermCode,
  termOptions,
  isReadOnly,
  roster,
  sections,
} = useTermSchedule(groupId, termCode);

/** The week is the one view a phone cannot draw; the day list stands in. */
const activeView = computed<ScheduleView>(() =>
  isSmall.value && schedule.view === "week" ? "day" : schedule.view,
);

/**
 * Every section as the user sees it, this browser's unsaved edits included,
 * and what the canvases draw once the filters have been applied. Both are
 * derived inside the editor, so nothing the editor owns travels back to it.
 */
const localSections = computed(() => schedule.localSections);
const placed = computed(() => schedule.placed);

/** Lists and counts cover the whole term, whatever is checked. */
const filterOptions = computed(() => buildFilterOptions(localSections.value));

/** What the filters panel still has reason to list; see `isInView` there. */
const reachableValues = computed(() =>
  reachableFacetValues(localSections.value, schedule.filters),
);

const sectionOf = (meetingId: string) =>
  placed.value.sectionsByMeetingId.get(meetingId);

const componentOf = (meeting: Meeting) => sectionOf(meeting.id)?.component;

/** One per day tab: the classes each weekday holds, then the unplaced ones. */
const dayCounts = computed(() => {
  const counts = WEEKDAY_NAMES.map(
    (_, dayIndex) =>
      bandsForDay(schedule.meetings, sectionOf, dayIndex).flatMap(
        ({ items }) => items,
      ).length,
  );

  counts[ASYNC_DAY_INDEX] = placed.value.unscheduled.length;
  return counts;
});

/**
 * The editor's one effect, run here because the page owns the router. Every
 * key the editor owns is cleared first, so a key the new query leaves out is
 * removed rather than left standing from whatever the URL said before.
 *
 * `replace` rather than `push`: stepping back through every checkbox and every
 * tab would make the back button useless for leaving the page.
 */
const runEffect = (effect: Effect) => {
  switch (effect.type) {
    case "replaceUrlQuery":
      router.replace({
        query: { ...omit(route.query, EDITOR_QUERY_KEYS), ...effect.query },
      });
  }
};

// Held here rather than inside a view, so that the toolbar, the filters panel,
// every view, and the detail sheet all read and change the same schedule.
const schedule = useScheduleEditor(
  computed(() => ({ sections: sections.value, isReadOnly: isReadOnly.value })),
  runEffect,
);

const { createSection, saveSection, deleteSection } = useTermPlanMutations(
  groupId,
  activeTermCode,
);

/**
 * The section being created, in the shape every view already reads. It has no
 * row on the server: its fields live in the editor's draft, which
 * `draftSection` lays over this stand-in.
 */
const newSection = computed<PlannedSection | null>(() => {
  if (!schedule.isCreatingSection || activeTermCode.value === null) return null;

  return {
    id: NEW_SECTION_ID,
    classNumber: null,
    termId: activeTermCode.value,
    courseCode: "",
    subject: "",
    catalogNumber: "",
    section: "001",
    title: "",
    component: "LEC",
    credits: null,
    enrollmentCap: 0,
    enrollmentTotal: 0,
    waitlistCap: 0,
    waitlistTotal: 0,
    instructors: [],
    meetings: [],
    crosslist: null,
    delivery: "onCampus",
    notes: "",
    isCancelled: false,
  };
});

async function createDrawnSection() {
  const standIn = newSection.value;
  if (!standIn) return;

  const created = await createSection.mutateAsync(
    toSectionPayload(schedule.draftSection(standIn)),
  );

  schedule.markSectionCreated(created.id);
}

async function deleteSelectedSection() {
  const section = selectedSection.value;
  if (!section) return;

  await deleteSection.mutateAsync(section.id);
  schedule.markSectionDeleted(section.id);
}

/** Closing the sheet on a section nobody created is discarding it. */
const closeSheet = () =>
  schedule.isNewSectionSelected
    ? schedule.discardNewSection()
    : schedule.deselect();

const coursesQuery = useTermPlanCoursesQuery(groupId);

/** Course codes a scheduler named, which the SIS has never published. */
const unofficialCourseCodes = computed(
  () =>
    new Set(
      (coursesQuery.data.value ?? [])
        .filter(({ source }) => source === "local")
        .map(({ courseCode }) => courseCode),
    ),
);

const isUnofficialSection = (section: PlannedSection) =>
  unofficialCourseCodes.value.has(section.courseCode);

const isUnofficialBlock = (meeting: Meeting) => {
  const section = sectionOf(meeting.id);
  return section !== undefined && isUnofficialSection(section);
};

/**
 * A section drawn but never created, or a sheet with typing behind its Save
 * button. Grid drags are not here: they go straight to the autosave.
 */
const hasUnsavedWork = computed(
  () =>
    schedule.isCreatingSection ||
    localSections.value.some((section) => schedule.isDraftDirty(section)),
);

const LEAVING_UNSAVED =
  "This page has changes that have not been saved. Leave and lose them?";

onBeforeRouteLeave(
  () => !hasUnsavedWork.value || window.confirm(LEAVING_UNSAVED),
);

// the browser shows its own wording; preventDefault is what asks for the prompt
useEventListener(window, "beforeunload", (event: BeforeUnloadEvent) => {
  if (hasUnsavedWork.value) event.preventDefault();
});

// Sections are read from `localSections`, not from the payload, so a section
// saves with the edits the reader can see on it rather than without them.
useTermPlanAutosave({
  sections: localSections,
  pendingEdits: computed(() => schedule.pendingEdits),
  save: (section) => saveSection.mutateAsync(section),
  onSaved: (sectionId, saved) => schedule.markEditsPersisted(sectionId, saved),
});

// The only way anything the URL carries is written: a pasted link on first
// load, the back button, or `runEffect`'s own write arriving back. `update`
// raises no effect for it, which is what stops the two answering each other.
watch(
  () => route.query,
  (query) => schedule.urlChanged(flattenQuery(query)),
  { immediate: true },
);

/** "Tue · 2 – 3p": how the sheet names the hour list it can go back to. */
const returnTo = computed(() => {
  const hour = schedule.hourReturnedTo;
  if (!hour) return null;

  return `${WEEKDAY_NAMES[hour.dayIndex]} · ${formatTimeRange(hour.startMinute, hour.startMinute + 60)}`;
});

const goBackToHour = () => {
  const hour = schedule.hourReturnedTo;
  if (hour) schedule.selectHour(hour.dayIndex, hour.startMinute);
};

/** The sections whose meetings overlap the selected hour, as the grid shows them. */
const hourEntries = computed<HourEntry[]>(() => {
  const hour = schedule.openHour;
  if (!hour) return [];

  return schedule.meetings
    .filter(
      (meeting) =>
        meeting.dayIndex === hour.dayIndex &&
        meeting.startMinute < hour.startMinute + 60 &&
        meeting.endMinute > hour.startMinute,
    )
    .flatMap((meeting) => {
      // A meeting drawn locally has no section to list.
      const section = sectionOf(meeting.id);
      return section ? [{ ...meeting, meetingId: meeting.id, section }] : [];
    })
    .sort((a, b) => a.startMinute - b.startMinute);
});

/**
 * The section the sheet is open on. A meeting drawn locally (local-N) belongs
 * to no section, so selecting it stores an id but opens no sheet.
 */
const selectedSection = computed(() => {
  if (schedule.isNewSectionSelected) return newSection.value;

  if (schedule.selectedMeetingId) {
    return sectionOf(schedule.selectedMeetingId) ?? null;
  }

  return (
    localSections.value.find(({ id }) => id === schedule.selectedSectionId) ??
    null
  );
});
</script>
