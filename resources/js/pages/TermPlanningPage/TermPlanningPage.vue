<template>
  <div class="tw-relative tw-p-4">
    <header class="tw-mb-8 tw-flex tw-items-start tw-justify-between tw-gap-4">
      <div>
        <h1>Term Planning</h1>
        <p class="tw-text-neutral-500">
          <template v-if="term">
            {{ term.name }} · {{ placed.shownCount }} of
            {{ placed.totalCount }} meetings shown
          </template>
          <template v-else>
            A week grid of the classes a department offers in one term.
          </template>
        </p>
      </div>
      <button
        type="button"
        class="tw-cursor-pointer tw-rounded-md tw-border tw-border-solid tw-border-neutral-300 tw-bg-white tw-px-3 tw-py-1 tw-text-sm"
        :aria-expanded="isSidebarShown"
        @click="isSidebarShown = !isSidebarShown"
      >
        {{ isSidebarShown ? "Hide filters" : "Show filters" }}
      </button>
    </header>

    <div class="tw-flex tw-items-start tw-gap-4">
      <!--
        Sticky rather than fixed, so it scrolls with the page header and only
        pins once the grid is taller than the window.
      -->
      <ScheduleSidebar
        v-if="isSidebarShown"
        class="tw-sticky tw-top-4 tw-max-h-[calc(100vh-2rem)] tw-w-80 tw-flex-none tw-overflow-y-auto"
        :options="filterOptions"
        :schedule="schedule"
      />

      <!-- min-w-0 lets the grid scroll sideways inside a flex row instead of stretching it. -->
      <div class="tw-min-w-0 tw-flex-1">
        <ActiveFilterBar
          :options="filterOptions"
          :schedule="schedule"
          :shownCount="visibleSections.length"
          :totalCount="allSections.length"
        />

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
      :section="selectedSection"
      @close="schedule.dispatch({ type: 'deselected' })"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import { isEqual, omit } from "lodash-es";
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

const isSidebarShown = ref(true);

// A meeting drawn locally (local-N) has no section, so selecting it stores
// an id but opens no sheet.
const selectedSection = computed(() => {
  const id = schedule.state.value.selectedMeetingId;
  return id ? (sectionOf(id) ?? null) : null;
});
</script>
