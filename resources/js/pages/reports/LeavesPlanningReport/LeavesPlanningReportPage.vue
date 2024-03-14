<template>
  <DefaultLayout>
    <h1>Leaves Planning Report</h1>

    <p>Count of leaves planned for each department within a given semester.</p>

    <Table>
      <THead>
        <Tr>
          <Th>Departments</Th>
          <Th v-for="label in termLabels" :key="label">
            {{ label }}
          </Th>
        </Tr>
      </THead>
      <TBody>
        <Tr v-for="row in leavePlanningReportRows" :key="row.department">
          <Td>{{ row.department }}</Td>
          <Td v-for="data in row.termData" :key="data.term">{{
            data.leavesCount
          }}</Td>
        </Tr>
      </TBody>
    </Table>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/Table";
import { ref, onMounted, computed } from "vue";
import * as T from "@/types";
import { times } from "lodash";

interface LeavePlanningReportRow {
  department: string;
  termData: {
    term: string;
    leavesCount: number;
  }[];
}

const leavePlanningReportRows = ref<LeavePlanningReportRow[]>([]);

function createMockRow(deptName: string): LeavePlanningReportRow {
  return {
    department: deptName,
    termData: [
      {
        term: "Fall 2019",
        leavesCount: 10,
      },
      {
        term: "Spring 2020",
        leavesCount: 9,
      },
    ],
  };
}

const termLabels = computed(() => {
  const firstRow = leavePlanningReportRows.value[0];
  return firstRow?.termData.map((data) => data.term) ?? [];
});

onMounted(() => {
  leavePlanningReportRows.value = times(10, (i) =>
    createMockRow(`Department ${i + 1}`),
  );
});
</script>
<style scoped></style>
