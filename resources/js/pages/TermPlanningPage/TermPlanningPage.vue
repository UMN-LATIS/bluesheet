<template>
  <FullScreenLayout>
    <div
      class="tw-flex tw-h-9 tw-flex-none tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-neutral-200 tw-bg-white tw-px-3 tw-text-sm"
    >
      <Breadcrumbs :crumbs="crumbs" />

      <label class="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-font-normal">
        <span class="tw-sr-only">Term</span>
        <select
          class="tw-rounded tw-border tw-border-solid tw-border-neutral-300 tw-bg-white tw-py-0.5 tw-pl-2 tw-pr-7 tw-text-sm"
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

    <!--
      Three columns filling the rest of the viewport. Each column fills the
      row's height and scrolls inside itself; the page never scrolls.
    -->
    <div class="tw-flex tw-min-h-0 tw-flex-1">
      <ScheduleSidebar
        v-model:isCollapsed="isSidebarCollapsed"
        class="tw-flex-none tw-border-0 tw-border-r tw-border-solid tw-border-neutral-200"
        :class="isSidebarCollapsed ? 'tw-w-10' : 'tw-w-80'"
        :options="filterOptions"
        :schedule="schedule"
      />

      <!-- min-w-0 lets the grid scroll sideways inside a flex row instead of stretching it. -->
      <div class="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
        <div
          class="tw-flex tw-min-h-9 tw-flex-none tw-items-center tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-neutral-200 tw-bg-white tw-px-3 tw-py-1 tw-text-xs tw-text-neutral-600"
        >
          <!-- Only when there is something the grid could not draw. -->
          <span
            v-if="placed.outsideGridCount > 0"
            class="tw-flex-none tw-text-amber-700"
          >
            {{ placed.outsideGridCount }}
            {{
              placed.outsideGridCount === 1 ? "meeting falls" : "meetings fall"
            }}
            outside Mon–Fri, 8am–9pm
          </span>
          <ActiveFilterBar
            :options="filterOptions"
            :schedule="schedule"
            :shownCount="visibleSections.length"
            :totalCount="allSections.length"
          />
          <MeetingTypeKey class="tw-ml-auto tw-flex-none" />
        </div>

        <!-- Sideways scrolling lands on a day's edge; see DayColumn for the target. -->
        <div
          class="tw-min-h-0 tw-flex-1 tw-snap-x tw-snap-mandatory tw-overflow-auto tw-bg-white"
        >
          <ScheduleGrid :schedule="schedule" :componentOf="componentOf">
            <template #block="{ meeting, width }">
              <SectionBlock
                v-if="sectionOf(meeting.id)"
                :section="sectionOf(meeting.id)!"
                :width="width"
                :startMinute="meeting.startMinute"
                :endMinute="meeting.endMinute"
              />
              <!-- A meeting drawn on the grid has no class on it yet. -->
              <MeetingTimes
                v-else
                :startMinute="meeting.startMinute"
                :endMinute="meeting.endMinute"
              />
            </template>
          </ScheduleGrid>
        </div>

        <UnscheduledTray
          class="tw-flex-none tw-border-0 tw-border-t tw-border-solid tw-border-neutral-200"
          :sections="placed.unscheduled"
          :selectedSectionId="selectedSection?.id ?? null"
          :schedule="schedule"
        />
      </div>

      <SectionSheet
        v-if="selectedSection"
        class="tw-w-96 tw-flex-none tw-border-0 tw-border-l tw-border-solid tw-border-neutral-200"
        :section="selectedSection"
        @close="schedule.dispatch({ type: 'deselected' })"
      />
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import { isEqual, omit } from "lodash-es";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs.vue";
import FullScreenLayout from "@/layouts/FullScreenLayout.vue";
import ActiveFilterBar from "./components/ActiveFilterBar.vue";
import MeetingTimes from "./components/MeetingTimes.vue";
import MeetingTypeKey from "./components/MeetingTypeKey.vue";
import ScheduleGrid from "./components/ScheduleGrid.vue";
import ScheduleSidebar from "./components/ScheduleSidebar.vue";
import SectionBlock from "./components/SectionBlock.vue";
import SectionSheet from "./components/SectionSheet.vue";
import UnscheduledTray from "./components/UnscheduledTray.vue";
import { currentTerm } from "./helpers/currentTerm";
import { buildFilterOptions } from "./helpers/filterOptions";
import { decodeFilters, encodeFilters } from "./helpers/filterQuery";
import { filterSections } from "./helpers/scheduleFilters";
import { placeSections } from "./helpers/sectionPlacement";
import { useGroupQuery } from "./queries/useGroupQuery";
import { useSisSectionsQuery } from "./queries/useSisSectionsQuery";
import { useSisTermsQuery } from "./queries/useSisTermsQuery";
import { FILTER_FACETS, type Meeting } from "./types";
import { useScheduleEditor } from "./useScheduleEditor";
import type { Effect } from "./useScheduleEditor/types";

const props = defineProps<{
  groupId: number;
  termCode: number | null;
}>();

const route = useRoute();
const router = useRouter();

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

const isSidebarCollapsed = ref(false);

const crumbs = computed<Crumb[]>(() => [
  { label: "My Groups", to: { name: "user" } },
  {
    label: groupQuery.data.value?.group_title ?? "",
    to: { name: "group", params: { groupId: props.groupId } },
  },
  { label: "Term Planning" },
]);

const sectionsQuery = useSisSectionsQuery(
  props.groupId,
  computed(() => term.value?.id ?? null),
);

const allSections = computed(() => sectionsQuery.data.value ?? []);

/** Lists and counts cover the whole term, whatever is checked. */
const filterOptions = computed(() => buildFilterOptions(allSections.value));

// The filters are read from `schedule`, declared below, and `schedule` is
// built from `placed`. That is not a cycle: both are computeds, nothing is
// read until the template renders, and by then both exist. The editor stores
// what is checked; the page applies it here, before the meetings become the
// editor's base, so a hidden section simply leaves the schedule.
const visibleSections = computed(() =>
  filterSections(allSections.value, schedule.state.value.filters),
);

const placed = computed(() => placeSections(visibleSections.value));

const sectionOf = (meetingId: string) =>
  placed.value.sectionsByMeetingId.get(meetingId);

const componentOf = (meeting: Meeting) => sectionOf(meeting.id)?.component;

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

// Held here rather than inside the grid, so that the sidebar, the filter
// bar, and the detail sheet all read and change the same schedule.
const schedule = useScheduleEditor(
  computed(() => placed.value.meetings),
  runEffect,
);

// The other direction of the URL sync: a pasted link on first load, or the
// back button. Comparing first is what stops this and `runEffect` from
// answering each other forever.
watch(
  () => route.query,
  (query) => {
    const fromUrl = decodeFilters(query);
    if (!isEqual(fromUrl, schedule.state.value.filters)) {
      schedule.dispatch({ type: "filtersReplaced", filters: fromUrl });
    }
  },
  { immediate: true },
);

// A meeting drawn locally (local-N) has no section, so selecting it stores
// an id but opens no sheet.
const selectedSection = computed(() => {
  const { selection } = schedule.state.value;
  if (!selection) return null;

  return selection.kind === "meeting"
    ? (sectionOf(selection.meetingId) ?? null)
    : (allSections.value.find(({ id }) => id === selection.sectionId) ?? null);
});
</script>
