<template>
  <div>
    <Table
      v-show="coursePlanningStore.visiblePeople.length"
      class="scheduling-report"
      :stickyFirstColumn="true"
      :stickyHeader="true"
    >
      <colgroup>
        <col />
        <col
          v-if="coursePlanningStore.isInPlanningMode"
          class="term-col tw-bg-striped"
          :span="coursePlanningStore.countOfTermsDisabledForPlanning"
        />
      </colgroup>
      <template #thead>
        <ReportTableHeaderRow :label="label" />
      </template>
      <TBody>
        <PersonTableRow
          v-for="person in coursePlanningStore.peopleInActiveGroup"
          :key="person.id"
          :person="person"
        />
      </TBody>
    </Table>
    <div v-show="coursePlanningStore.visiblePeople.length === 0">
      <div
        class="tw-flex tw-min-h-[25vh] tw-rounded-md tw-items-center tw-justify-center tw-gap-2 tw-border tw-border-neutral-200 tw-p-4 tw-bg-neutral-100"
      >
        <span class="tw-text-neutral-400">None</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Table, TBody } from "@/components/Table";
import PersonTableRow from "./PersonTableRow.vue";
import ReportTableHeaderRow from "../ReportTableHeaderRow.vue";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";

defineProps<{
  label: string;
  groupId: number;
}>();

const coursePlanningStore = useRootCoursePlanningStore();
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
