<template>
  <WideLayout>
    <h1 class="tw-mb-4">
      {{ group?.group_title }} <br />
      <span class="tw-text-3xl">Scheduling Report</span>
    </h1>

    <div class="tw-relative tw-min-h-[8em]">
      <Table
        ref="tableRef"
        class="scheduling-report"
        :stickyFirstColumn="true"
        :stickyHeader="true"
      >
        <template #thead>
          <tr>
            <Th class="instructor-column">Instructor</Th>
            <Th
              v-for="term in terms"
              :id="`term-${term.id}`"
              :key="term.id"
              class="tw-whitespace-nowrap term-header-column"
              :class="{
                '!tw-bg-amber-100 !tw-border-amber-300 term-header-column--is-current-term':
                  term.id === currentTerm?.id,
                'term-header-column--is-fall-term': term.name.includes('Fall'),
              }"
            >
              {{ term.name }}
            </Th>
          </tr>
        </template>
        <ReportRow
          v-for="instructor in allInstructors"
          :key="instructor.id"
          :instructor="instructor"
          :terms="terms"
          :listOfTermCourses="getListOfInstructorCourses(instructor.id)"
          :listOfTermLeaves="getListOfInstructorLeaves(instructor)"
          :currentTerm="currentTerm"
          :isShowingCourse="() => true"
          :search="''"
        />

        <!-- <ReportRow
          v-for="instructor in instructors"
          :key="instructor.id"
          :instructor="instructor"
          :search="''"
          :termsLookup="termsLookup"
          :coursesByTerm="coursesByInstructorAndTerm[instructor.id]"
          :currentTerm="currentTerm"
        /> -->
      </Table>
    </div>
  </WideLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Table, Th } from "@/components/Table";
import ReportRow from "./ReportRow.vue";
import WideLayout from "@/layouts/WideLayout.vue";
import { useGroup } from "@/composables/useGroup";
import { useGroupCourseHistory } from "@/composables/useGroupCourseHistory";
import { Instructor, Leave, Term } from "@/types";
import { dayjs } from "@/lib";

const props = defineProps<{
  groupId: number;
}>();

const tableRef = ref<HTMLElement>();
const group = useGroup(props.groupId);
const {
  terms,
  currentTerm,
  allInstructors,
  instructorsByCourseTerm,
  coursesByInstructorTerm,
} = useGroupCourseHistory(props.groupId);

function getInstructorTermCourses(instructorId: number, termId: number) {
  return coursesByInstructorTerm.value.get(`${instructorId}-${termId}`) ?? [];
}

function getListOfInstructorCourses(instructorId: number) {
  return terms.value.map((term) => {
    return getInstructorTermCourses(instructorId, term.id);
  });
}

function selectInstructorTermLeaves(
  instructor: Instructor,
  term: Term,
): Leave[] {
  return (
    instructor.leaves?.filter((leave) => {
      const leaveStart = dayjs(leave.start_date);
      const leaveEnd = dayjs(leave.end_date);
      const termStart = dayjs(term.startDate);
      const termEnd = dayjs(term.endDate);

      return (
        termStart.isBetween(leaveStart, leaveEnd, "day", "[]") ||
        termEnd.isBetween(leaveStart, leaveEnd, "day", "[]")
      );
    }) ?? []
  );
}

function getListOfInstructorLeaves(instructor: Instructor) {
  return terms.value.map((term) => {
    return selectInstructorTermLeaves(instructor, term);
  });
}
</script>
<style scoped lang="scss">
.details-list {
  max-width: 480px;
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 0 1rem;
  align-items: baseline;
  margin-top: 1rem;
  margin-bottom: 1rem;

  & dt {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
  }
}
</style>
<style lang="scss">
.scheduling-report-page__post-it {
  max-width: 90em;
  padding: 1rem;
  width: 100%;
  margin: auto;
}
.scheduling-report-page__post-it .outer-container {
  max-width: 100% !important;
}

.term-header-column.term-header-column--is-fall-term {
  border-left: 2px solid #eee;
}
</style>
