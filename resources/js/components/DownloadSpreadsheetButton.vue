<template>
  <Button
    variant="tertiary"
    title="Download Spreadsheet"
    @click="downloadSpreadsheet"
  >
    <slot><DownloadIcon /> <span class="tw-sr-only">Download</span></slot>
  </Button>
</template>
<script setup lang="ts">
import Button from "./Button.vue";
import { DownloadIcon } from "@/icons";
import { utils, writeFileXLSX } from "xlsx";

export interface SheetData {
  sheetName: string;
  data: Record<string, string | number>[];
}

const props = defineProps<{
  filename: string;
  sheetData: SheetData[];
}>();

function downloadSpreadsheet() {
  const wb = utils.book_new();
  props.sheetData.forEach((sheet) => {
    const ws = utils.json_to_sheet(sheet.data);
    utils.book_append_sheet(wb, ws, sheet.sheetName);
  });
  writeFileXLSX(wb, props.filename);
}
</script>
<style scoped></style>
