<template>
  <dl
    class="tw-m-0 tw-grid tw-grid-cols-[auto_minmax(0,1fr)_auto] tw-gap-x-3 tw-rounded-[10px] tw-bg-surface tw-px-3 tw-py-2 tw-text-[13px]"
  >
    <div
      v-for="line in lines"
      :key="line.label"
      class="tw-col-span-3 tw-grid tw-grid-cols-subgrid tw-items-baseline tw-py-1"
      :class="{
        'tw-border-0 tw-border-t tw-border-solid tw-border-outline-variant tw-font-semibold':
          line.kind === 'subtotal',
        'tw-mt-1 tw-border-0 tw-border-t-2 tw-border-solid tw-border-outline tw-pt-2 tw-text-[15px] tw-font-bold':
          line.kind === 'total',
      }"
    >
      <dt :class="{ 'tw-col-span-2': line.detail === null }">
        {{ line.label }}
      </dt>
      <dd
        v-if="line.detail !== null"
        class="tw-m-0 tw-truncate tw-text-xs tw-text-on-surface-variant"
        :title="line.detail"
      >
        {{ line.detail }}
      </dd>
      <dd class="tw-m-0 tw-text-right tw-tabular-nums">
        <MissingRate v-if="line.amount === null" />
        <template v-else>{{
          formatDollars(roundedToCents(line.amount))
        }}</template>
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import MissingRate from "./MissingRate.vue";
import type { ReceiptLine } from "../../helpers/costReceipt";
import { formatDollars } from "../../helpers/money";

defineProps<{ lines: ReceiptLine[] }>();

const roundedToCents = (dollars: number) => Math.round(dollars * 100) / 100;
</script>
