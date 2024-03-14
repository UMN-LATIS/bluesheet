<template>
  <DefaultLayout>
    <p
      class="tw-uppercase tw-text-sm tw-leading-relaxed tw-text-neutral-500 tw-m-0 tw-font-medium"
    >
      Report
    </p>
    <h1 class="tw-mt-0">Leaves</h1>

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
        <Tr v-for="row in leaveCountReportRows" :key="row.department">
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
import * as api from "@/api";

// TODO: add permissions for if user can view this report

const leaveCountReportRows = ref<T.LeaveCountReportRow[]>([]);

const termLabels = computed(() => {
  if (leaveCountReportRows.value.length === 0) {
    return [];
  }
  const firstRow = leaveCountReportRows.value[0];
  return firstRow?.termData.map((data) => data.term) ?? [];
});

onMounted(async () => {
  leaveCountReportRows.value = await api.getDeptLeaveCountReportRows();
});
</script>
<style scoped></style>
