<template>
  <dl
    class="tw-m-0 tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-gap-x-3 tw-rounded-[10px] tw-bg-surface tw-px-3 tw-py-2 tw-text-[13px]"
  >
    <div
      v-for="line in lines"
      :key="line.label"
      class="tw-col-span-2 tw-grid tw-grid-cols-subgrid tw-items-baseline tw-py-1"
      :class="{
        'tw-border-0 tw-border-t tw-border-solid tw-border-outline-variant tw-font-semibold':
          line.kind === 'subtotal',
        'tw-mt-1 tw-border-0 tw-border-t-2 tw-border-solid tw-border-outline tw-pt-2 tw-text-[15px] tw-font-bold':
          line.kind === 'total',
      }"
    >
      <dt>{{ line.label }}</dt>
      <dd class="tw-m-0 tw-text-right tw-tabular-nums">
        <MissingRate v-if="line.amount === null" />
        <template v-else>{{
          formatDollars(roundedToCents(line.amount))
        }}</template>
      </dd>
      <dd
        v-if="line.parts.length > 0"
        class="tw-col-span-2 tw-m-0 tw-mt-0.5 tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap tw-text-xs tw-font-normal tw-text-on-surface-variant"
      >
        <template v-for="(part, index) in line.parts" :key="index">
          <span v-if="typeof part === 'string'">{{ part }}</span>
          <span
            v-else-if="!canEdit"
            class="tw-font-semibold tw-text-on-surface"
            >{{ formatReceiptValue(part.kind, part.value) }}</span
          >
          <span
            v-else
            class="tw-inline-grid tw-min-h-7 tw-flex-none tw-rounded tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright"
            :class="isWholeNumberKind(part.kind) ? 'tw-w-16' : 'tw-w-24'"
          >
            <EditableCell
              :kind="part.kind"
              :value="part.value"
              :valueWithoutOverride="part.valueWithoutOverride"
              :isOverridden="part.isOverridden"
              :canEdit="canEdit"
              :label="`${RECEIPT_FIELD_LABELS[part.field]} for ${personName}`"
              @change="(value) => emit('editInput', part.field, value)"
            />
          </span>
        </template>
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import EditableCell from "./EditableCell.vue";
import MissingRate from "./MissingRate.vue";
import {
  formatReceiptValue,
  RECEIPT_FIELD_LABELS,
  type ReceiptField,
  type ReceiptLine,
} from "../../helpers/costReceipt";
import { formatDollars } from "../../helpers/money";

defineProps<{
  lines: ReceiptLine[];
  canEdit: boolean;
  personName: string;
}>();

const emit = defineEmits<{
  editInput: [field: ReceiptField, value: number | null];
}>();

const isWholeNumberKind = (kind: string) =>
  kind === "hours" || kind === "count";

const roundedToCents = (dollars: number) => Math.round(dollars * 100) / 100;
</script>
