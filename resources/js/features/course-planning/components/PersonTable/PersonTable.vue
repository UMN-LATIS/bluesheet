<template>
  <Table
    class="scheduling-report"
    :stickyFirstColumn="true"
    :stickyHeader="true"
  >
    <colgroup v-if="coursePlanningStore.isInPlanningMode">
      <col class="person-col" />
      <col
        class="term-col tw-bg-striped"
        :span="colspanOfDisabledColsInPlanningMode"
      />
    </colgroup>

    <template #thead>
      <ReportTableHeaderRow :label="label" />
    </template>
    <TBody class="!tw-bg-transparent">
      <PersonTableRow
        v-for="person in coursePlanningStore.peopleInActiveGroup"
        :key="person.id"
        :person="person"
      />
    </TBody>
  </Table>
</template>
<script setup lang="ts">
import { Table, TBody } from "@/components/Table";
import PersonTableRow from "./PersonTableRow.vue";
import ReportTableHeaderRow from "../ReportTableHeaderRow.vue";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import { computed } from "vue";

defineProps<{
  label: string;
  groupId: number;
}>();

const coursePlanningStore = useRootCoursePlanningStore();

const colspanOfDisabledColsInPlanningMode = computed((): number => {
  return Object.values(coursePlanningStore.canTermBePlannedLookup).reduce(
    (acc, canTermBePlanned) => {
      return canTermBePlanned ? acc : acc + 1;
    },
    0,
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
