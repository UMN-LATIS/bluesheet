<template>
  <Table
    class="scheduling-report"
    :stickyFirstColumn="true"
    :stickyHeader="true"
  >
    <template #thead>
      <ReportTableHeaderRow
        :label="label"
        :terms="coursePlanningStore.terms"
        :currentTerm="coursePlanningStore.currentTerm"
      />
    </template>
    <TBody>
      <InstructorTableRow
        v-for="person in people"
        :key="person.id"
        :person="person"
      />
    </TBody>
  </Table>
</template>
<script setup lang="ts">
import { Table, TBody } from "@/components/Table";
import InstructorTableRow from "./InstructorTableRow.vue";
import ReportTableHeaderRow from "./ReportTableHeaderRow.vue";
import { EnrollmentRole } from "../coursePlanningTypes";
import { useRootCoursePlanningStore } from "../stores/useRootCoursePlanningStore";
import { computed } from "vue";

const props = defineProps<{
  label: string;
  groupId: number;
  roles: EnrollmentRole[];
}>();

const coursePlanningStore = useRootCoursePlanningStore();
const people = computed(() => {
  const peopleWithRoles = coursePlanningStore.getPeopleInGroupWithRoles(
    props.groupId,
    props.roles,
  );
  console.log("peopleWithRoles", peopleWithRoles);
  return peopleWithRoles;
});
</script>
<style scoped></style>
