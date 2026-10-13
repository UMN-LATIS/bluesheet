<template>
  <template v-if="offerings.length > 0">
    <FieldDivider class="tw-mx-3" />

    <Disclosure label="Previous enrollment" :summary="summary">
      <div class="tw-flex tw-flex-col tw-gap-1.5">
        <span class="tw-self-end tw-text-[11px] tw-text-on-surface-variant">
          census day · enrolled / cap
        </span>
        <div
          class="tw-grid tw-grid-cols-[auto_minmax(0,1fr)_auto_auto] tw-items-center tw-gap-x-2 tw-gap-y-1 tw-rounded-[10px] tw-bg-surface tw-px-3 tw-py-2.5 tw-text-[11.5px]"
        >
          <template v-for="offering in offerings" :key="offering.termCode">
            <span class="tw-text-on-surface-variant">{{
              offering.termName
            }}</span>
            <span class="tw-truncate">{{ offering.instructorLastName }}</span>
            <span class="tw-whitespace-nowrap tw-text-on-surface-variant">
              {{ offering.meetingSummary }}
            </span>
            <span
              class="tw-justify-self-end tw-rounded-sm tw-px-1.5 tw-py-0.5 tw-text-center tw-font-bold tw-tabular-nums tw-text-[#262626]"
              :style="{ background: offering.fillColor }"
            >
              {{ offering.enrolledOfCap }}
            </span>
          </template>
        </div>
      </div>
    </Disclosure>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import FieldDivider from "@/components/planning/FieldDivider.vue";
import Disclosure from "./Disclosure.vue";
import type { PreviousOffering } from "../helpers/enrollmentHistory";

const props = defineProps<{ offerings: PreviousOffering[] }>();

const summary = computed(() => {
  const [latest] = props.offerings;
  return latest ? `${latest.termName} · ${latest.enrolledOfCap}` : "";
});
</script>
