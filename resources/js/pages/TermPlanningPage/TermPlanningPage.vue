<template>
  <FullScreenLayout>
    <!-- Breadcrumb row: filled in by the next phase. -->
    <div
      class="tw-flex tw-h-9 tw-flex-none tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-neutral-200 tw-bg-white tw-px-3 tw-text-sm"
    >
      <span class="tw-text-neutral-600">Term Planning</span>
      <span v-if="term" class="tw-text-neutral-600">{{ term.name }}</span>
    </div>

    <!--
      Three columns filling the rest of the viewport. Each column fills the
      row's height and scrolls inside itself; the page never scrolls.
    -->
    <div class="tw-flex tw-min-h-0 tw-flex-1">
      <ScheduleSidebar
        class="tw-w-80 tw-flex-none tw-border-0 tw-border-r tw-border-solid tw-border-neutral-200"
        :options="filterOptions"
        :schedule="schedule"
      />

      <!-- min-w-0 lets the grid scroll sideways inside a flex row instead of stretching it. -->
      <div class="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
        <div
          class="tw-flex tw-min-h-9 tw-flex-none tw-items-center tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-neutral-200 tw-bg-white tw-px-3 tw-py-1 tw-text-xs tw-text-neutral-600"
        >
          <span v-if="term" class="tw-flex-none">
            {{ placed.shownCount }} of {{ placed.totalCount }} meetings shown
          </span>
          <ActiveFilterBar
            :options="filterOptions"
            :schedule="schedule"
            :shownCount="visibleSections.length"
            :totalCount="allSections.length"
          />
        </div>

        <div class="tw-min-h-0 tw-flex-1 tw-overflow-auto tw-bg-white">
          <ScheduleGrid :schedule="schedule" :toneOf="toneOf">
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
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import { isEqual, omit } from "lodash-es";
import FullScreenLayout from "@/layouts/FullScreenLayout.vue";
import ActiveFilterBar from "./components/ActiveFilterBar.vue";
import MeetingTimes from "./components/MeetingTimes.vue";
import ScheduleGrid from "./components/ScheduleGrid.vue";
import ScheduleSidebar from "./components/ScheduleSidebar.vue";
import SectionBlock from "./components/SectionBlock.vue";
import SectionSheet from "./components/SectionSheet.vue";
import { currentTerm } from "./helpers/currentTerm";
import { buildFilterOptions } from "./helpers/filterOptions";
import { decodeFilters, encodeFilters } from "./helpers/filterQuery";
import { filterSections } from "./helpers/scheduleFilters";
import { placeSections } from "./helpers/sectionPlacement";
import { useSisSectionsQuery } from "./queries/useSisSectionsQuery";
import { useSisTermsQuery } from "./queries/useSisTermsQuery";
import { type BlockTone, FILTER_FACETS, type Meeting } from "./types";
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

/** DIS and LAB are both meetings a class splits into, so they share a tone. */
const toneOf = (meeting: Meeting): BlockTone | undefined => {
  const component = sectionOf(meeting.id)?.component;
  if (component === "LEC") return "lecture";

  return component === "DIS" || component === "LAB" ? "discussion" : undefined;
};

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
  const id = schedule.state.value.selectedMeetingId;
  return id ? (sectionOf(id) ?? null) : null;
});
</script>
