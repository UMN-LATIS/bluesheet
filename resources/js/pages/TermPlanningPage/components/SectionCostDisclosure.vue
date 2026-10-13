<template>
  <Disclosure label="Cost" :summary="details.summary">
    <div class="tw-flex tw-flex-col tw-gap-2">
      <div v-for="row in details.rows" :key="row.key" class="tw-text-[13px]">
        <div class="tw-flex tw-items-baseline tw-gap-2">
          <span class="tw-min-w-0 tw-flex-1 tw-truncate">
            {{ row.name
            }}<span v-if="row.isTa" class="tw-text-on-surface-variant">
              · TA</span
            >
          </span>
          <MissingRate v-if="row.amount === null" />
          <span v-else class="tw-font-semibold tw-tabular-nums">
            {{ formatWholeDollars(row.amount) }}
          </span>
        </div>
        <p
          v-if="row.unpaidReason"
          class="tw-m-0 tw-mt-0.5 tw-text-[11px] tw-text-on-surface-variant"
        >
          {{ row.unpaidReason }}
        </p>
      </div>
    </div>
  </Disclosure>
</template>

<script setup lang="ts">
import Disclosure from "./Disclosure.vue";
import MissingRate from "./budget/MissingRate.vue";
import { formatWholeDollars } from "../helpers/money";
import type { SectionCostDetails } from "../helpers/sectionCostRows";

defineProps<{ details: SectionCostDetails }>();
</script>
