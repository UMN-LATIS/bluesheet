<template>
  <Table
    class="scheduling-report"
    :stickyFirstColumn="true"
    :stickyHeader="true"
  >
    <template #thead>
      <ReportTableHeaderRow :label="label" />
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
import * as T from "../coursePlanningTypes";
import { useRootCoursePlanningStore } from "../stores/useRootCoursePlanningStore";
import { computed } from "vue";

const props = defineProps<{
  label: string;
  groupId: number;
  roles: T.EnrollmentRole[];
}>();

const coursePlanningStore = useRootCoursePlanningStore();

const people = computed(() => {
  return coursePlanningStore.getPeopleInGroupWithRoles(
    props.groupId,
    props.roles,
  );
});
</script>
<style lang="scss">
// fix width of cells to prevent them from embiggening
// when a collapseable item is expanded
.scheduling-report td,
.scheduling-report th {
  min-width: 16rem;
  max-width: 16rem;
}
</style>
