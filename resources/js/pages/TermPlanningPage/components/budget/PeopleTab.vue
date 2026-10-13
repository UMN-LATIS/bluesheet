<template>
  <div
    class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-7 tw-overflow-auto tw-px-[18px] tw-py-4"
  >
    <p
      v-if="isFiltered"
      class="tw-m-0 tw-text-[11.5px] tw-text-on-surface-variant"
    >
      People, loads, and costs here cover every section this term, not only the
      filtered ones.
    </p>
    <p
      v-if="fundGroups.length === 0"
      class="tw-m-0 tw-text-sm tw-text-on-surface-variant"
    >
      No one is teaching a section this term yet.
    </p>
    <section v-for="fundGroup in fundGroups" :key="fundGroup.fund">
      <div
        class="tw-flex tw-items-baseline tw-gap-2.5 tw-border-0 tw-border-b tw-border-solid tw-border-on-surface tw-pb-1.5"
      >
        <h3 class="tw-m-0 tw-text-[13px] tw-font-bold">
          {{ fundGroup.label }}
        </h3>
        <span class="tw-text-[11px] tw-text-on-surface-variant">
          {{ fundGroup.note }}
        </span>
        <span class="tw-ml-auto tw-text-xs tw-font-bold tw-tabular-nums">
          {{ formatWholeDollars(fundGroup.total) }}
        </span>
      </div>
      <div
        role="table"
        :aria-label="fundGroup.label"
        class="tw-grid tw-grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,2fr)] tw-text-xs"
      >
        <div role="row" class="tw-contents">
          <ColumnHeading
            v-for="heading in HEADINGS"
            :key="heading.label"
            role="columnheader"
            :class="{ 'tw-text-right': heading.isNumeric }"
          >
            {{ heading.label }}
          </ColumnHeading>
        </div>
        <div
          v-for="person in fundGroup.people"
          :key="person.emplid"
          role="row"
          class="tw-contents"
          :class="person.isUnderLoad ? '[&>*]:tw-bg-[#fef2f2]' : ''"
        >
          <BudgetCell
            role="cell"
            :hasRightBorder="false"
            class="tw-py-1.5 tw-font-semibold"
          >
            {{ person.name }}
          </BudgetCell>
          <BudgetCell
            role="cell"
            :hasRightBorder="false"
            class="tw-py-1.5 tw-text-on-surface-variant"
          >
            <span class="tw-truncate" :title="person.jobLabel">
              {{ person.jobLabel }}
            </span>
          </BudgetCell>
          <BudgetCell
            role="cell"
            :hasRightBorder="false"
            align="end"
            class="tw-py-1.5"
            :class="{ 'tw-font-bold tw-text-[#b91c1c]': person.isUnderLoad }"
          >
            {{ person.loadLabel }}
          </BudgetCell>
          <BudgetCell
            role="cell"
            :hasRightBorder="false"
            align="end"
            class="tw-relative tw-py-1.5 tw-font-semibold"
            :class="{ '!tw-bg-accent-container-low': person.hasOverride }"
          >
            <MissingRate v-if="person.hasMissingRate" class="tw-mr-1" />
            {{ formatWholeDollars(person.cost) }}
            <OverrideMarker v-if="person.hasOverride" />
          </BudgetCell>
          <BudgetCell
            role="cell"
            :hasRightBorder="false"
            class="tw-flex-wrap tw-gap-1 tw-py-1"
          >
            <button
              v-for="paidSection in person.paidSections"
              :key="paidSection.sectionId"
              type="button"
              class="tw-inline-flex tw-cursor-pointer tw-items-center tw-whitespace-nowrap tw-rounded-full tw-border tw-border-l-[3px] tw-border-solid tw-border-outline-variant tw-px-2 tw-py-px tw-text-[11px] tw-font-semibold tw-text-on-surface hover:tw-border-outline"
              :class="[
                colorOfType(paidSection.component).rail,
                colorOfType(paidSection.component).tint,
              ]"
              :aria-label="`Open ${paidSection.label}`"
              @click="emit('selectSection', paidSection.sectionId)"
            >
              {{ paidSection.label }}
            </button>
            <span
              v-if="person.unpaidSectionCount > 0"
              class="tw-text-[11px] tw-text-on-surface-variant"
            >
              +{{ person.unpaidSectionCount }} at no added cost
            </span>
          </BudgetCell>
        </div>
      </div>
    </section>
    <p
      v-if="fundGroups.length > 0"
      class="tw-m-0 tw-text-[11.5px] tw-text-on-surface-variant"
    >
      Load is sections paid this term of half the job code's annual load. TAs
      show their appointment. Pink rows are under load: check for a release or
      buyout.
    </p>
  </div>
</template>

<script setup lang="ts">
import { colorOfType } from "@/utils/meetingTypeColors";
import BudgetCell from "./BudgetCell.vue";
import ColumnHeading from "./ColumnHeading.vue";
import MissingRate from "./MissingRate.vue";
import OverrideMarker from "./OverrideMarker.vue";
import { formatWholeDollars } from "../../helpers/money";
import type { FundGroup } from "../../helpers/peopleRows";

defineProps<{ fundGroups: FundGroup[]; isFiltered: boolean }>();

const emit = defineEmits<{ selectSection: [sectionId: number] }>();

const HEADINGS = [
  { label: "Name", isNumeric: false },
  { label: "Job code", isNumeric: false },
  { label: "Load", isNumeric: true },
  { label: "Est. cost", isNumeric: true },
  { label: "Sections", isNumeric: false },
];
</script>
