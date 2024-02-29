<template>
  <Button
    variant="tertiary"
    title="Download Spreadsheet"
    @click="handleDownloadClick"
  >
    <template v-if="downloadStatus === 'idle'">
      <DownloadIcon /> <span class="tw-sr-only">Download</span>
    </template>
    <template v-else-if="downloadStatus === 'loading'">
      <Spinner class="tw-w-5 tw-h-5 tw-text-blue-500" />
      <span class="tw-sr-only">Loading</span>
      {{ Math.round(progress * 100) }}%
    </template>
    <template v-else-if="downloadStatus === 'complete'">
      <CheckIcon /> <span class="tw-sr-only">Complete</span>
    </template>
    <template v-else>
      <CircleXIcon /> <span class="tw-sr-only">Error</span>
    </template>
  </Button>
</template>
<script setup lang="ts">
import * as T from "@/types";
import { useErrorStore } from "@/stores/useErrorStore";
import Button from "./Button.vue";
import { DownloadIcon } from "@/icons";
import { LoadState } from "@/types";
import { nextTick, ref } from "vue";
import { utils, writeFileXLSX } from "xlsx";
import Spinner from "./Spinner.vue";
import { CheckIcon, CircleXIcon } from "@/icons";
import { useSimulatedProgress } from "@/features/course-planning/helpers/useSimulatedProgress";

const props = defineProps<{
  filename: string;
  sheetData: T.SpreadsheetData[];
}>();

const downloadStatus = ref<LoadState>("idle");

const errorStore = useErrorStore();
const { progress, simulateUpTo } = useSimulatedProgress();

async function downloadSpreadsheet(): Promise<void> {
  const wb = utils.book_new();
  for (const sheet of props.sheetData) {
    if (typeof sheet.data === "function") {
      const complete = simulateUpTo(1 / props.sheetData.length);
      sheet.data = await sheet.data();
      complete();
      console.log(`sheet complete: ${sheet.sheetName}`);
    }
    const ws = utils.json_to_sheet(sheet.data);
    utils.book_append_sheet(wb, ws, sheet.sheetName);
  }
  writeFileXLSX(wb, props.filename);
}

function resetDownloadStatus(delay = 3000): void {
  setTimeout(() => {
    downloadStatus.value = "idle";
  }, delay);
}

async function handleDownloadClick(): Promise<void> {
  downloadStatus.value = "loading";

  // Wait for the next tick to ensure the loading state is rendered
  await nextTick();

  // also wrap in a setTimeout to push the download to the end of the
  // event loop, allowing the state change to render
  setTimeout(async () => {
    try {
      await downloadSpreadsheet();
      downloadStatus.value = "complete";
      resetDownloadStatus();
    } catch (error) {
      console.error(error);
      downloadStatus.value = "error";
      if (error instanceof Error) {
        errorStore.setError(error);
      }
      resetDownloadStatus(10000);
    }
  }, 0);
}
</script>
<style scoped></style>
