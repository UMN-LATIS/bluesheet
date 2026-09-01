<template>
  <div class="tw-p-4">
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

    <ScheduleGrid :schedule="schedule">
      <template #block="{ meeting, width }">
        <SectionBlock
          v-if="sectionOf(meeting.id)"
          :section="sectionOf(meeting.id)!"
          :width="width"
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
</template>

<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import MeetingTimes from "./components/MeetingTimes.vue";
import ScheduleGrid from "./components/ScheduleGrid.vue";
import SectionBlock from "./components/SectionBlock.vue";
import { currentTerm } from "./helpers/currentTerm";
import { placeSections } from "./helpers/sectionPlacement";
import { useSisSectionsQuery } from "./queries/useSisSectionsQuery";
import { useSisTermsQuery } from "./queries/useSisTermsQuery";
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

// Held here rather than inside the grid, so that the toolbar, sidebar and
// detail sheet still to come all read and change the same schedule.
const schedule = useScheduleEditor(computed(() => placed.value.meetings));
</script>
