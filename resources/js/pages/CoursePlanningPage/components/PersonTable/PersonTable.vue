<template>
  <div>
    <Button variant="tertiary" @click="downloadAsSpreadsheet">
      Download
    </Button>

    <Table
      v-show="coursePlanningStore.visiblePeople.length"
      ref="personTableContainer"
      class="scheduling-report"
      :stickyFirstColumn="true"
      :stickyHeader="true"
    >
      <colgroup>
        <col />
        <col
          v-for="term in coursePlanningStore.termsStore.terms"
          v-show="coursePlanningStore.isTermVisible(term.id)"
          :key="term.id"
          class="term-col"
          :class="{
            'tw-bg-striped':
              coursePlanningStore.isInPlanningMode &&
              !coursePlanningStore.termsStore.isTermPlannable(term.id),
          }"
        />
      </colgroup>
      <THead>
        <ReportTableHeaderRow :label="label" />
      </THead>
      <TBody>
        <PersonTableRow
          v-for="person in coursePlanningStore.personStore.allPeople"
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
import { Table, TBody, THead, TableType } from "@/components/Table";
import PersonTableRow from "./PersonTableRow.vue";
import ReportTableHeaderRow from "../ReportTableHeaderRow.vue";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import { onMounted, ref, computed } from "vue";
import Button from "@/components/Button.vue";
import { utils, writeFileXLSX } from 'xlsx';

onMounted(() => {
  performance.mark("CoursePlanningPage:end");
  performance.measure(
    "CoursePlanningPage",
    "CoursePlanningPage:start",
    "CoursePlanningPage:end",
  );

  console.log(
    "CoursePlanningPage",
    performance.getEntriesByName("CoursePlanningPage"),
  );
});

defineProps<{
  label: string;
  groupId: number;
}>();

const coursePlanningStore = useRootCoursePlanningStore();

const personTableContainer = ref<TableType | null>(null);

function downloadAsSpreadsheet() {
  if (!personTableContainer.value) {
    throw new Error('personTableContainer is not defined');
  }
  const tableEl = personTableContainer.value.getTableElement();

  const wb = utils.table_to_book(tableEl);
  writeFileXLSX(wb, "SheetJSVueHTML.xlsx");
}
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
