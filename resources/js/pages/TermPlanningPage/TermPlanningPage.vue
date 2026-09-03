<template>
  <FullScreenLayout>
    <template #bar>
      <div class="tw-flex tw-min-w-0 tw-items-baseline tw-gap-2">
        <!-- On a phone the department and the view switch say where you
             are, and the bar has no width for a title as well. -->
        <span
          class="tw-hidden tw-truncate tw-text-[15px] tw-font-semibold tw-tracking-tight cramped:tw-block cramped:tw-text-base roomy:tw-text-[17px]"
        >
          Term Planning
        </span>
        <!-- A scheduler covering several departments moves between them
             here, rather than through the group page and back. -->
        <label class="tw-m-0 tw-min-w-0 tw-font-normal">
          <span class="tw-sr-only">Department</span>
          <select
            class="tw-max-w-[15rem] tw-cursor-pointer tw-truncate tw-border-none tw-bg-transparent tw-p-0 tw-text-[13px] tw-text-on-surface-variant hover:tw-text-on-surface"
            :value="groupId"
            @change="goToGroup(($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="option in departmentOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ labelOfDepartment(option) }}
            </option>
          </select>
        </label>
      </div>

      <div class="tw-ml-auto tw-flex tw-flex-none tw-items-center tw-gap-2.5">
        <!--
          Only where a panel has to be summoned. Docked, the filters are
          already on screen and a button to reveal them would say nothing.
        -->
        <button
          v-if="arePanelsOverlaid"
          type="button"
          class="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-bg-surface-bright tw-px-3 tw-text-xs tw-font-semibold hover:tw-bg-surface roomy:tw-min-h-0 roomy:tw-py-1.5"
          :class="
            activeFilterCount > 0
              ? 'tw-border-primary tw-text-primary'
              : 'tw-border-outline tw-text-on-surface'
          "
          :aria-expanded="isFilterPanelOpen"
          aria-label="Filters"
          title="Filters"
          @click="isFilterPanelOpen = true"
        >
          <FilterIcon aria-hidden="true" />
          <span
            v-if="activeFilterCount > 0"
            class="tw-rounded-full tw-bg-primary tw-px-1.5 tw-text-[10px] tw-leading-4 tw-text-on-primary"
          >
            {{ activeFilterCount }}
          </span>
        </button>

        <!-- A week of lanes cannot be read on a phone, so that one option
             drops out; the switch itself stays, since the day list and the
             heatmap are both worth having there. -->
        <div
          role="group"
          aria-label="View"
          class="tw-inline-flex tw-gap-0.5 tw-rounded-full tw-bg-outline-variant tw-p-0.5"
        >
          <button
            v-for="option in viewOptions"
            :key="option.value"
            type="button"
            class="tw-cursor-pointer tw-rounded-full tw-border-none tw-px-3.5 tw-py-1.5 tw-text-xs tw-font-semibold"
            :class="
              activeView === option.value
                ? 'tw-bg-surface-bright tw-text-on-surface tw-shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'tw-bg-transparent tw-text-on-surface-variant hover:tw-text-on-surface'
            "
            :aria-pressed="activeView === option.value"
            @click="view = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <label class="tw-m-0 tw-flex tw-items-center tw-font-normal">
          <span class="tw-sr-only">Term</span>
          <select
            class="tw-min-h-11 tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-py-1.5 tw-pl-3.5 tw-pr-8 tw-text-[13px] tw-font-semibold tw-text-on-surface roomy:tw-min-h-0"
            :value="term?.id"
            @change="goToTerm(($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="option in termOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ labelOfTerm(option) }}
            </option>
          </select>
        </label>

        <!--
          Read-only is a property of the term, so it is named on the control
          that picks one. Below `cramped` the bar has no width to spare, and
          the strip under it says the same thing at greater length.
        -->
        <span
          v-if="isReadOnly"
          class="tw-hidden tw-flex-none tw-items-center tw-gap-1.5 cramped:tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-container tw-py-1 tw-pl-2 tw-pr-2.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
        >
          <LockIcon class="tw-h-3 tw-w-3 tw-flex-none" />
          Read only
        </span>
      </div>
    </template>

    <!--
      The panes float as cards on the recessed page. `relative` is what the
      two overlaid panels are positioned against, so they cover the canvas
      and not the bar above it.
    -->
    <div
      class="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-gap-3 tw-px-3 tw-pb-3 roomy:tw-px-4 roomy:tw-pb-4"
    >
      <div v-if="isLarge" :class="[PANE_CLASS, 'tw-w-[304px] tw-flex-none']">
        <ScheduleSidebar
          :options="filterOptions"
          :schedule="schedule"
          :reachable="reachableValues"
        />
      </div>

      <section
        :aria-label="`${VIEW_LABELS[activeView]} schedule`"
        :class="[
          PANE_CLASS,
          'tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col',
        ]"
      >
        <DayView
          v-if="activeView === 'day'"
          :dayIndex="currentDayIndex"
          :meetings="schedule.meetings"
          :sectionOf="sectionOf"
          :unscheduled="placed.unscheduled"
          :counts="dayCounts"
          :schedule="schedule"
          :size="size"
          @selectDay="currentDayIndex = $event"
        />

        <div
          v-else-if="activeView === 'week'"
          class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-auto tw-bg-surface-bright"
        >
          <ScheduleGrid
            :schedule="schedule"
            :componentOf="componentOf"
            :unscheduled="placed.unscheduled"
            :selectedSectionId="selectedSection?.id ?? null"
          >
            <template #block="{ meeting, width }">
              <SectionBlock
                v-if="sectionOf(meeting.id)"
                :section="sectionOf(meeting.id)!"
                :width="width"
                :isEdited="schedule.hasEdits(sectionOf(meeting.id)!.id)"
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
            @showAsync="showAsyncDay"
          />
        </div>
      </section>

      <!--
        Docked beside the canvas where there is room for it, and lifted over
        the canvas where there is not. The panel itself is the same either
        way; only this mount changes.
      -->
      <div
        v-if="openSheet && isLarge"
        :class="[PANE_CLASS, 'tw-w-[404px] tw-flex-none']"
      >
        <component
          :is="openSheet.is"
          v-bind="openSheet.props"
          v-on="openSheet.on"
        />
      </div>

      <template v-if="openSheet && !isLarge">
        <div
          v-if="isSmall"
          class="tw-fixed tw-inset-0 tw-z-50 tw-bg-surface-bright"
        >
          <component
            :is="openSheet.is"
            v-bind="{ ...openSheet.props, hasHandle: true }"
            v-on="openSheet.on"
          />
        </div>
        <div
          v-else
          :class="[
            PANE_CLASS,
            'tw-absolute tw-inset-y-0 tw-right-3 tw-z-50 tw-w-[380px] tw-shadow-[-18px_0_44px_rgba(38,38,38,0.16)]',
          ]"
        >
          <component
            :is="openSheet.is"
            v-bind="openSheet.props"
            v-on="openSheet.on"
          />
        </div>
      </template>

      <!-- Summoned, so it closes again; a click on the canvas behind it is
           how a panel opened by mistake gets out of the way. -->
      <template v-if="isFilterPanelOpen && !isLarge">
        <div
          class="tw-absolute tw-inset-0 tw-z-40 tw-bg-black/20"
          @click="isFilterPanelOpen = false"
        />
        <div
          :class="[
            isSmall
              ? 'tw-fixed tw-inset-0 tw-z-50 tw-bg-surface-bright'
              : [
                  PANE_CLASS,
                  'tw-absolute tw-inset-y-0 tw-left-3 tw-z-50 tw-w-[304px] tw-shadow-[18px_0_44px_rgba(38,38,38,0.16)]',
                ],
          ]"
        >
          <ScheduleSidebar
            :options="filterOptions"
            :schedule="schedule"
            :reachable="reachableValues"
            isDismissible
            @close="isFilterPanelOpen = false"
          />
        </div>
      </template>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter, type LocationQueryRaw } from "vue-router";
import dayjs from "dayjs";
import { isEqual, omit, pick } from "lodash-es";
import FullScreenLayout from "@/layouts/FullScreenLayout.vue";
import { FilterIcon, LockIcon } from "@/icons";
import CoverageHeatmap from "./components/CoverageHeatmap.vue";
import DayView from "./components/DayView.vue";
import HourSheet, { type HourEntry } from "./components/HourSheet.vue";
import MeetingTimes from "./components/MeetingTimes.vue";
import ScheduleGrid from "./components/ScheduleGrid.vue";
import ScheduleSidebar from "./components/ScheduleSidebar.vue";
import SectionBlock from "./components/SectionBlock.vue";
import SectionSheet from "./components/SectionSheet.vue";
import { currentTerm } from "./helpers/currentTerm";
import { bandsForDay } from "./helpers/dayBands";
import { buildFilterOptions } from "./helpers/filterOptions";
import { decodeFilters, encodeFilters } from "./helpers/filterQuery";
import {
  decodeSelection,
  encodeSelection,
  SELECTION_KEYS,
  type SheetSelection,
} from "./helpers/selectionQuery";
import {
  decodeDayIndex,
  decodeView,
  encodeDayIndex,
  type ScheduleView,
} from "./helpers/viewQuery";
import {
  filterSections,
  reachableFacetValues,
} from "./helpers/scheduleFilters";
import { ASYNC_DAY_INDEX, WEEKDAY_NAMES } from "./helpers/scheduleDays";
import { placeSections } from "./helpers/sectionPlacement";
import { isTermReadOnly } from "./helpers/termLock";
import { formatTimeRange } from "./helpers/timeScale";
import { useGroupQuery } from "./queries/useGroupQuery";
import { useSisEmployeesQuery } from "./queries/useSisEmployeesQuery";
import { useSisGroupsQuery } from "./queries/useSisGroupsQuery";
import { useSisSectionsQuery } from "./queries/useSisSectionsQuery";
import { useSisTermsQuery } from "./queries/useSisTermsQuery";
import {
  FILTER_FACETS,
  type Meeting,
  type SisGroup,
  type SisTerm,
} from "./types";
import { useScheduleEditor } from "./useScheduleEditor";
import type { Effect, HourSelection } from "./useScheduleEditor/types";
import { useScreenSize } from "./useScreenSize";

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

const { size, isLarge, isSmall, arePanelsOverlaid } = useScreenSize();

/** Every pane is a card lifted off the page's own recessed surface. */
const PANE_CLASS =
  "tw-overflow-hidden tw-rounded-[14px] tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-shadow-[0_1px_2px_rgba(0,0,0,0.04)]";

const VIEW_OPTIONS: { value: ScheduleView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "heatmap", label: "Heatmap" },
];

const viewOptions = computed(() =>
  VIEW_OPTIONS.filter((option) => !(isSmall.value && option.value === "week")),
);

const VIEW_LABELS: Record<ScheduleView, string> = {
  day: "Day",
  week: "Week",
  heatmap: "Coverage",
};

/**
 * The view lives in the URL rather than in a ref, so a link carries the page
 * as its sender left it. `replace` throughout, as with the filters below:
 * stepping back through every switch of a tab would make the back button
 * useless for leaving the page.
 */
const view = computed<ScheduleView>({
  get: () => decodeView(route.query.view),
  set: (nextView) =>
    replaceQuery(
      // The day list shows one day at a time, so a link to it has to say which.
      nextView === "day"
        ? { view: nextView, day: encodeDayIndex(currentDayIndex.value) }
        : { view: nextView },
    ),
});

/** The week is the one view a phone cannot draw; the day list stands in. */
const activeView = computed<ScheduleView>(() =>
  isSmall.value && view.value === "week" ? "day" : view.value,
);

/** Monday through Friday, then the sections with no meeting time. */
const currentDayIndex = computed<number>({
  get: () => decodeDayIndex(route.query.day) ?? todaysColumn(),
  set: (dayIndex) => replaceQuery({ day: encodeDayIndex(dayIndex) }),
});

const replaceQuery = (changes: LocationQueryRaw) =>
  router.replace({ query: { ...route.query, ...changes } });

// One replace rather than two writes: `view` and `day` land together, so
// neither reads a query the other has not committed yet.
const showAsyncDay = () =>
  replaceQuery({ view: "day", day: encodeDayIndex(ASYNC_DAY_INDEX) });

/** Today, when the week is on; otherwise the week's first day. */
function todaysColumn(): number {
  const weekday = dayjs().day() - 1;
  return weekday >= 0 && weekday < WEEKDAY_NAMES.length ? weekday : 0;
}

const isFilterPanelOpen = ref(false);

// A panel summoned on a narrow screen has no business staying open once the
// window is wide enough to dock it.
watch(isLarge, (isDocked) => {
  if (isDocked) isFilterPanelOpen.value = false;
});

const today = () => dayjs().format("YYYY-MM-DD");

const termsQuery = useSisTermsQuery();

/** The term the URL names, or failing that the one we are in today. */
const term = computed(() => {
  const terms = termsQuery.data.value ?? [];

  return props.termCode === null
    ? currentTerm(terms, today())
    : (terms.find(({ id }) => id === props.termCode) ?? null);
});

/** Everything read-only on this page hangs off this one value. */
const isReadOnly = computed(() => isTermReadOnly(term.value, today()));

/** The term today falls inside, which is the one worth marking in the list. */
const isCurrent = (option: SisTerm) =>
  option.startDate !== null &&
  option.endDate !== null &&
  option.startDate <= today() &&
  today() <= option.endDate;

/** Newest first, since planning looks forward. */
const termOptions = computed(() =>
  [...(termsQuery.data.value ?? [])].sort((a, b) => b.id - a.id),
);

// The filters ride along in the query, so a view narrowed to one person
// stays narrowed when the term changes.
const goToTerm = (termCode: string) =>
  router.push({
    name: "termPlanning",
    params: { groupId: props.groupId, termCode },
    query: route.query,
  });

const groupQuery = useGroupQuery(groupId);

const groupsQuery = useSisGroupsQuery();

/**
 * The department on screen leads the list even before it loads, so the
 * control never reads as empty and never as some other department.
 */
const departmentOptions = computed<SisGroup[]>(() => {
  const departments = groupsQuery.data.value ?? [];
  if (departments.some(({ id }) => id === props.groupId)) return departments;

  const current = groupQuery.data.value;
  return current
    ? [
        {
          id: props.groupId,
          name: current.group_title,
          abbreviation: current.abbreviation,
        },
        ...departments,
      ]
    : departments;
});

/**
 * "PSY - Psychology", or the code alone where the bar is too tight to spell it
 * out. Whichever half the group has, when it has only one.
 */
const labelOfDepartment = ({ name, abbreviation }: SisGroup) => {
  if (isSmall.value && abbreviation) return abbreviation;

  return [abbreviation, name].filter(Boolean).join(" - ") || "Department";
};

/** The term we are in is marked, unless the mark costs the bar too much. */
const labelOfTerm = (option: SisTerm) =>
  !isSmall.value && isCurrent(option)
    ? `${option.name} – Current`
    : option.name;

// The filters and any open sheet name this department's own courses and
// sections, so they are left behind. The view and the day are not: they are
// how a scheduler reads any department.
const goToGroup = (nextGroupId: string) =>
  router.push({
    name: "termPlanning",
    params: { groupId: nextGroupId, termCode: props.termCode ?? undefined },
    query: pick(route.query, ["view", "day"]),
  });

const employeesQuery = useSisEmployeesQuery(groupId);

/** Who a section can be assigned to: the department's own people. */
const roster = computed(() => employeesQuery.data.value ?? []);

const sectionsQuery = useSisSectionsQuery(
  groupId,
  computed(() => term.value?.id ?? null),
);

const allSections = computed(() => sectionsQuery.data.value ?? []);

/**
 * Every section as the user sees it, this browser's unsaved edits included.
 * Everything below is built from these rather than from the payload, so an
 * edit reaches every view at once.
 */
const localSections = computed(() => schedule.localSections(allSections.value));

/** Lists and counts cover the whole term, whatever is checked. */
const filterOptions = computed(() => buildFilterOptions(localSections.value));

// `localSections` and the filters are read from `schedule`, declared below,
// and `schedule` is built from `placed`. That is not a cycle: all of them are
// computeds, nothing is read until the template renders, and by then they all
// exist. The editor stores what is checked; the page applies it here, before
// the sections are placed, so a hidden section simply leaves the schedule.
const visibleSections = computed(() =>
  filterSections(localSections.value, schedule.filters),
);

/** What the filters panel still has reason to list; see `isInView` there. */
const reachableValues = computed(() =>
  reachableFacetValues(localSections.value, schedule.filters),
);

const placed = computed(() => placeSections(visibleSections.value));

/** What the week view managed to draw, which is the rest of what is shown. */
const scheduledCount = computed(
  () => visibleSections.value.length - placed.value.unscheduled.length,
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

const activeFilterCount = computed(() =>
  Object.values(schedule.filters).reduce(
    (sum, values) => sum + values.length,
    0,
  ),
);

/**
 * The editor's effects, run here because the page owns the router. `replace`
 * rather than `push`: stepping back through every checkbox would make the
 * back button useless for leaving the page.
 */
const runEffect = (effect: Effect) => {
  switch (effect.type) {
    case "syncFiltersToUrl":
      router.replace({
        query: {
          ...omit(route.query, FILTER_FACETS),
          ...encodeFilters(effect.filters),
        },
      });
  }
};

// Held here rather than inside a view, so that the filters panel, every
// view, and the detail sheet all read and change the same schedule.
const schedule = useScheduleEditor(
  computed(() => ({
    meetings: placed.value.meetings,
    sections: localSections.value,
    isReadOnly: isReadOnly.value,
  })),
  runEffect,
);

// The other direction of the URL sync: a pasted link on first load, or the
// back button. Comparing first is what stops this and `runEffect` from
// answering each other forever.
watch(
  () => route.query,
  (query) => {
    const fromUrl = decodeFilters(query);
    if (!isEqual(fromUrl, schedule.filters)) {
      schedule.replaceFilters(fromUrl);
    }
  },
  { immediate: true },
);

/** What the URL would say about the open sheet, given what is selected now. */
const selectionQuery = computed(() =>
  encodeSelection(
    schedule.selection,
    (meetingId) => sectionOf(meetingId)?.id ?? null,
  ),
);

// Out to the URL: a sheet opened or closed here. Comparing against the query
// itself, rather than against the selection, is what keeps a selected grid
// block from being rewritten as a plain section selection on the way back in.
watch(selectionQuery, (query) => {
  if (isEqual(query, pick(route.query, SELECTION_KEYS))) return;

  router.replace({
    query: { ...omit(route.query, SELECTION_KEYS), ...query },
  });
});

// And in from the URL: a pasted link on first load, or the back button. A key
// the page cannot read leaves nothing selected, and the watch above then
// clears it from the URL.
watch(
  () => route.query,
  (query) => {
    if (isEqual(pick(query, SELECTION_KEYS), selectionQuery.value)) return;

    applySelection(decodeSelection(query));
  },
  { immediate: true },
);

function applySelection(selection: SheetSelection | null) {
  if (!selection) return schedule.deselect();

  return selection.kind === "hour"
    ? schedule.selectHour(selection.dayIndex, selection.startMinute)
    : schedule.selectSection(selection.sectionId, selection.from);
}

const selectedHour = computed(() => {
  const selection = schedule.selection;
  return selection?.kind === "hour" ? selection : null;
});

/** "Tue · 2 – 3p": how both sheets name an hour. */
const hourLabel = (hour: HourSelection) =>
  `${WEEKDAY_NAMES[hour.dayIndex]} · ${formatTimeRange(hour.startMinute, hour.startMinute + 60)}`;

/** The hour list a selected section was picked from, if it was. */
const sectionReturnTo = computed<HourSelection | null>(() => {
  const selection = schedule.selection;
  return selection?.kind === "section" ? (selection.from ?? null) : null;
});

/** The sections whose meetings overlap the selected hour, as the grid shows them. */
const hourEntries = computed<HourEntry[]>(() => {
  const hour = selectedHour.value;
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

// A meeting drawn locally (local-N) has no section, so selecting it stores
// an id but opens no sheet.
const selectedSection = computed(() => {
  const selection = schedule.selection;
  if (!selection || selection.kind === "hour") return null;

  return selection.kind === "meeting"
    ? (sectionOf(selection.meetingId) ?? null)
    : (localSections.value.find(({ id }) => id === selection.sectionId) ??
        null);
});

/**
 * Which panel the right-hand mount is holding, if any. Both sheets take the
 * same place on the page and only one can be open, so the mount is described
 * once here and the three breakpoints each render it their own way.
 */
const openSheet = computed(() => {
  if (selectedHour.value) {
    return {
      is: HourSheet,
      props: {
        dayIndex: selectedHour.value.dayIndex,
        dayName: WEEKDAY_NAMES[selectedHour.value.dayIndex],
        startMinute: selectedHour.value.startMinute,
        entries: hourEntries.value,
        schedule,
      },
      on: {
        close: () => schedule.deselect(),
        // The hour stays selected, so the sheet is still open beside the week.
        showInWeek: () => {
          view.value = "week";
        },
      },
    };
  }

  if (!selectedSection.value) return null;

  return {
    is: SectionSheet,
    props: {
      section: selectedSection.value,
      schedule,
      sections: localSections.value,
      roster: roster.value,
      returnTo: sectionReturnTo.value && hourLabel(sectionReturnTo.value),
      termName: term.value?.name,
      isReadOnly: isReadOnly.value,
    },
    on: {
      back: () =>
        sectionReturnTo.value &&
        schedule.selectHour(
          sectionReturnTo.value.dayIndex,
          sectionReturnTo.value.startMinute,
        ),
      close: () => schedule.deselect(),
    },
  };
});
</script>
