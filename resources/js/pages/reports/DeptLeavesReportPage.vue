<template>
  <WideLayout v-if="$can(T.UserPermissions.VIEW_LEAVES)">
    <p
      class="tw-uppercase tw-text-sm tw-leading-relaxed tw-text-neutral-500 tw-m-0 tw-font-medium"
    >
      Report
    </p>
    <h1 class="tw-mt-0 tw-mb-8">Department Leaves</h1>

    <div
      v-if="loadStatus === 'loading'"
      class="tw-p-8 tw-flex-col tw-justify-center tw-items-center tw-text-center tw-bg-neutral-50 tw-text-neutral-400"
    >
      <p class="tw-text-neutral-400 tw-text-sm">
        Generating Report... this could take a minute
      </p>
      <ProgressSpinner :progress="progress" />
    </div>

    <Table v-else :stickyHeader="true" :stickyFirstColumn="true">
      <THead>
        <Tr>
          <Th>Departments</Th>
          <Th v-for="label in termLabels" :key="label">
            {{ label }}
          </Th>
        </Tr>
      </THead>
      <TBody>
        <Tr v-for="row in leaveCountReportRows" :key="row.group.id">
          <Th>
            {{ row.group.name }}
          </Th>
          <Td v-for="data in row.leavesByTerm" :key="data.term">
            <span
              v-if="data.leaveCountByStatus.all === 0"
              class="tw-text-neutral-400"
            >
              -
            </span>
            <div
              v-for="[status, count] in Object.entries(
                data.leaveCountByStatus,
              ).filter(([status, count]) => count > 0 && status !== 'all')"
              :key="status"
              class="tw-flex tw-items-baseline tw-gap-1 tw-justify-between tw-text-xs tw-my-1"
            >
              <span class="tw-uppercase tw-text-xs tw-text-neutral-400">{{
                status
              }}</span>
              <span
                class="tw-block tw-px-2 tw-rounded-full tw-bg-neutral-100 tw-text-neutral-900"
                >{{ count }}</span
              >
            </div>
          </Td>
        </Tr>
      </TBody>
    </Table>
  </WideLayout>
</template>
<script setup lang="ts">
import { Table, THead, TBody, Tr, Th, Td } from "@/components/Table";
import { ref, onMounted, computed } from "vue";
import * as T from "@/types";
import * as api from "@/api";
import ProgressSpinner from "@/components/ProgressSpinner.vue";
import { useSimulatedProgress } from "@/utils/useSimulatedProgress";
import WideLayout from "@/layouts/WideLayout.vue";
import { $can } from "@/utils";

// TODO: add permissions for if user can view this report

const leaveCountReportRows = ref<T.DeptLeavesReportRow[]>([]);

const termLabels = computed(() => {
  if (leaveCountReportRows.value.length === 0) {
    return [];
  }
  const firstRow = leaveCountReportRows.value[0];
  return firstRow?.leavesByTerm.map((data) => data.term) ?? [];
});

const loadStatus = ref<T.LoadState>("loading");
const { progress, simulateUpTo } = useSimulatedProgress();

onMounted(async () => {
  const progressSpinnerComplete = simulateUpTo(0.9);
  leaveCountReportRows.value = await api.getDeptLeavesReport();
  loadStatus.value = "complete";
  progressSpinnerComplete();
});
</script>
<style scoped></style>
