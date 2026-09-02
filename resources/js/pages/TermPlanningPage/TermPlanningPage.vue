<template>
  <FullScreenLayout>
    <template #bar>
      <div class="tw-flex tw-min-w-0 tw-items-baseline tw-gap-2">
        <span
          class="tw-truncate tw-text-[15px] tw-font-semibold tw-tracking-tight cramped:tw-text-base roomy:tw-text-[17px]"
        >
          Term Planning
        </span>
        <router-link
          v-if="groupQuery.data.value"
          :to="{ name: 'group', params: { groupId } }"
          class="tw-hidden tw-truncate tw-text-[13px] tw-text-on-surface-variant tw-no-underline hover:tw-text-on-surface hover:tw-underline cramped:tw-block"
        >
          {{ groupQuery.data.value.group_title }}
        </router-link>
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
          @click="isFilterPanelOpen = true"
        >
          <FilterIcon aria-hidden="true" />
          <!-- The icon carries the meaning where the bar is tight; the
               button keeps its name for a screen reader either way. -->
          <span class="tw-hidden cramped:tw-inline">Filters</span>
          <span
            v-if="activeFilterCount > 0"
            class="tw-rounded-full tw-bg-primary tw-px-1.5 tw-text-[10px] tw-leading-4 tw-text-on-primary"
          >
            {{ activeFilterCount }}
          </span>
        </button>

        <!-- A week of lanes cannot be read on a phone, so the day list is
             the only view offered and there is nothing to switch between. -->
        <div
          v-if="!isSmall"
          role="group"
          aria-label="View"
          class="tw-inline-flex tw-gap-0.5 tw-rounded-full tw-bg-outline-variant tw-p-0.5"
        >
          <button
            v-for="option in VIEW_OPTIONS"
            :key="option.value"
            type="button"
            class="tw-cursor-pointer tw-rounded-full tw-border-none tw-px-3.5 tw-py-1.5 tw-text-xs tw-font-semibold"
            :class="
              view === option.value
                ? 'tw-bg-surface-bright tw-text-on-surface tw-shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'tw-bg-transparent tw-text-on-surface-variant hover:tw-text-on-surface'
            "
            :aria-pressed="view === option.value"
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
              {{ option.name }}
            </option>
          </select>
        </label>
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
        <ScheduleSidebar :options="filterOptions" :schedule="schedule" />
      </div>

      <section
        :aria-label="`${VIEW_LABELS[activeView]} schedule`"
        :class="[
          PANE_CLASS,
          'tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col',
        ]"
      >
        <!--
          The week is the only view that needs a line of its own to say how
          much of the term it managed to draw. The day view says it in its
          own summary strip, and the heatmap counts nothing.
        -->
        <div
          v-if="activeView === 'week'"
          class="tw-flex tw-h-[46px] tw-flex-none tw-items-center tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-px-4 tw-text-[12.5px]"
        >
          <span class="tw-flex-none">
            <span class="tw-font-semibold">{{ scheduledCount }}</span>
            of {{ visibleSections.length }} sections scheduled
          </span>
          <span
            v-if="placed.outsideGridCount > 0"
            class="tw-truncate tw-text-xs tw-text-amber-700"
          >
            {{ placed.outsideGridCount }}
            {{
              placed.outsideGridCount === 1 ? "meeting falls" : "meetings fall"
            }}
            outside Mon–Fri, 8am–9pm
          </span>
        </div>

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
            :schedule="schedule"
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
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import { isEqual, omit } from "lodash-es";
import FullScreenLayout from "@/layouts/FullScreenLayout.vue";
import { FilterIcon } from "@/icons";
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
import { filterSections } from "./helpers/scheduleFilters";
import { ASYNC_DAY_INDEX, WEEKDAY_NAMES } from "./helpers/scheduleDays";
import { placeSections } from "./helpers/sectionPlacement";
import { formatTimeRange } from "./helpers/timeScale";
import { useGroupQuery } from "./queries/useGroupQuery";
import { useSisEmployeesQuery } from "./queries/useSisEmployeesQuery";
import { useSisSectionsQuery } from "./queries/useSisSectionsQuery";
import { useSisTermsQuery } from "./queries/useSisTermsQuery";
import { FILTER_FACETS, type Meeting } from "./types";
import { useScheduleEditor } from "./useScheduleEditor";
import type { Effect, HourSelection } from "./useScheduleEditor/types";
import { useScreenSize } from "./useScreenSize";

const props = defineProps<{
  groupId: number;
  termCode: number | null;
}>();

const route = useRoute();
const router = useRouter();

const { size, isLarge, isSmall, arePanelsOverlaid } = useScreenSize();

/** Every pane is a card lifted off the page's own recessed surface. */
const PANE_CLASS =
  "tw-overflow-hidden tw-rounded-[14px] tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-shadow-[0_1px_2px_rgba(0,0,0,0.04)]";

const VIEW_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "heatmap", label: "Heatmap" },
] as const;

type ScheduleView = (typeof VIEW_OPTIONS)[number]["value"];

const VIEW_LABELS: Record<ScheduleView, string> = {
  day: "Day",
  week: "Week",
  heatmap: "Coverage",
};

/**
 * The day list leads: it is the view that answers "what is on Monday" without
 * asking the reader to measure anything, and it is the only one a phone can
 * show.
 */
const view = ref<ScheduleView>("day");

const activeView = computed<ScheduleView>(() =>
  isSmall.value ? "day" : view.value,
);

/** Monday through Friday, then the sections with no meeting time. */
const currentDayIndex = ref(todaysColumn());

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

const termsQuery = useSisTermsQuery();

/** The term the URL names, or failing that the one we are in today. */
const term = computed(() => {
  const terms = termsQuery.data.value ?? [];

  return props.termCode === null
    ? currentTerm(terms, dayjs().format("YYYY-MM-DD"))
    : (terms.find(({ id }) => id === props.termCode) ?? null);
});

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

const groupQuery = useGroupQuery(props.groupId);

const employeesQuery = useSisEmployeesQuery(props.groupId);

/** Who a section can be assigned to: the department's own people. */
const roster = computed(() => employeesQuery.data.value ?? []);

const sectionsQuery = useSisSectionsQuery(
  props.groupId,
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
      on: { close: () => schedule.deselect() },
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
