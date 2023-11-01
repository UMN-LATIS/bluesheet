<template>
  <WideLayout>
    <h1 class="tw-mb-4">
      {{ group?.group_title }} <br />
      <span class="tw-text-3xl">Scheduling Report</span>
    </h1>

    <div class="tw-relative tw-min-h-[8em]">
      <InstructorTable
        :terms="terms"
        :instructors="allInstructors"
        :currentTerm="currentTerm"
        :coursesByInstructorTermMap="coursesByInstructorTermMap"
        :getLeavesForInstructorPerTerm="getLeavesForInstructorPerTerm"
        :getCoursesForInstructorPerTerm="getCoursesForInstructorPerTerm"
      />
    </div>
  </WideLayout>
</template>

<script setup lang="ts">
import WideLayout from "@/layouts/WideLayout.vue";
import { useGroup } from "@/composables/useGroup";
import { useGroupCourseHistory } from "@/composables/useGroupCourseHistory";
import InstructorTable from "./InstructorTable.vue";

const props = defineProps<{
  groupId: number;
}>();

const group = useGroup(props.groupId);
const {
  terms,
  currentTerm,
  allInstructors,
  getLeavesForInstructorPerTerm,
  getCoursesForInstructorPerTerm,
  coursesByInstructorTermMap,
} = useGroupCourseHistory(props.groupId);
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
