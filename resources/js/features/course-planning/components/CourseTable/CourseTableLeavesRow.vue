<template>
  <tr
    class="course-table-leaves-row"
    :class="{
      'course-table-leaves-row--sticky': sticky,
    }"
  >
    <Td> Leaves </Td>
    <Td
      v-for="term in coursePlanningStore.terms"
      v-show="isTermVisible(term.id)"
      :key="term.id"
      class="term-data-column"
      :class="{
        'term-data-column--current': coursePlanningStore.isCurrentTerm(term.id),
        'term-data-column--fall': term.name.includes('Fall'),
      }"
    >
      <div class="leaves-container tw-flex tw-flex-col tw-gap-1">
        <LeaveChip
          v-for="leave in coursePlanningStore.getLeavesForGroupInTerm(
            groupId,
            term.id,
          )"
          :key="leave.id"
          :leave="leave"
          variant="person"
          :class="{
            'tw-bg-yellow-100': false,
          }"
        />
      </div>
    </Td>
  </tr>
</template>
<script setup lang="ts">
import LeaveChip from "../LeaveChip.vue";
import { Td } from "@/components/Table";
import type { Term, Group } from "@/types";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import { computed } from "vue";
// import { doesInstructorNameMatchSearchTerm } from "./doesInstructorNameMatchSearchTerm";

withDefaults(
  defineProps<{
    groupId: Group["id"];
    sticky?: boolean;
  }>(),
  {
    sticky: false,
  },
);

const coursePlanningStore = useRootCoursePlanningStore();

const isTermVisibleLookup = computed(() =>
  coursePlanningStore.terms.reduce(
    (acc, term) => ({
      ...acc,
      [term.id]: coursePlanningStore.isTermVisible(term.id),
    }),
    {} as Record<string, boolean>,
  ),
);

function isTermVisible(termId: Term["id"]) {
  return isTermVisibleLookup.value[termId];
}
</script>
<style scoped>
.term-data-column.term-data-column--current {
  background: #fffcf0;
  border-top: 1px solid #fde68a;
}

.term-data-column.term-data-column--current.term-data-column--fall {
  border-left: 2px solid #fde68a;
}

.term-data-column.term-data-column--fall {
  border-left: 2px solid #f3f3f3;
}

.course-table-leaves-row--sticky td:first-child {
  position: sticky;
  top: 2.5rem;
  left: 0;
  background: #fafafa;
  z-index: 2;
  border-right: #eee;
}

.course-table-leaves-row--sticky td {
  position: sticky;
  top: 2.5rem;
  z-index: 1;
  background: #fff;
  border-bottom: 2px solid #eee;
}

.course-table-leaves-row--sticky .leaves-container {
  max-height: 9rem;
  overflow-y: auto;
}
</style>
