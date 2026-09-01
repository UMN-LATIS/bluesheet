<template>
  <div class="tw-relative tw-p-4">
    <header class="tw-mb-8">
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
    </header>

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

    <SectionSheet
      v-if="selectedSection"
      :section="selectedSection"
      @close="schedule.dispatch({ type: 'deselected' })"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import MeetingTimes from "./components/MeetingTimes.vue";
import ScheduleGrid from "./components/ScheduleGrid.vue";
import SectionBlock from "./components/SectionBlock.vue";
import SectionSheet from "./components/SectionSheet.vue";
import { currentTerm } from "./helpers/currentTerm";
import { placeSections } from "./helpers/sectionPlacement";
import { useSisSectionsQuery } from "./queries/useSisSectionsQuery";
import { useSisTermsQuery } from "./queries/useSisTermsQuery";
import type { BlockTone, Meeting } from "./types";
import { useScheduleEditor } from "./useScheduleEditor";

const props = defineProps<{
  groupId: number;
  termCode: number | null;
}>();

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

const placed = computed(() => placeSections(sectionsQuery.data.value ?? []));

const sectionOf = (meetingId: string) =>
  placed.value.sectionsByMeetingId.get(meetingId);

/** DIS and LAB are both meetings a class splits into, so they share a tone. */
const toneOf = (meeting: Meeting): BlockTone | undefined => {
  const component = sectionOf(meeting.id)?.component;
  if (component === "LEC") return "lecture";

  return component === "DIS" || component === "LAB" ? "discussion" : undefined;
};

// Held here rather than inside the grid, so that the toolbar, sidebar and
// detail sheet still to come all read and change the same schedule.
const schedule = useScheduleEditor(computed(() => placed.value.meetings));

// A meeting drawn locally (local-N) has no section, so selecting it stores
// an id but opens no sheet.
const selectedSection = computed(() => {
  const id = schedule.state.value.selectedMeetingId;
  return id ? (sectionOf(id) ?? null) : null;
});
</script>
