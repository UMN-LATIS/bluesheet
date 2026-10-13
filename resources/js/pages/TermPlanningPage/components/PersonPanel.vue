<template>
  <aside
    aria-label="Person details"
    class="tw-flex tw-h-full tw-w-full tw-min-h-0 tw-flex-col tw-bg-surface-bright tw-text-on-surface"
  >
    <div
      class="tw-flex-none tw-border-0 tw-border-b tw-border-solid tw-border-outline-variant tw-px-[18px] tw-pb-3 tw-pt-3.5"
    >
      <div class="tw-flex tw-items-center tw-gap-2">
        <span
          v-if="budget"
          class="tw-inline-flex tw-h-5 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-px-2.5 tw-text-[10px] tw-font-bold tw-tabular-nums"
        >
          {{ budget.jobCode }}
        </span>
        <span
          v-if="budget && budget.fundLabel !== '—'"
          class="tw-text-[11px] tw-text-on-surface-variant"
        >
          {{ budget.fundLabel }}
        </span>
        <button
          type="button"
          aria-label="Close"
          class="tw-ml-auto tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <h2
        class="tw-m-0 tw-mt-0.5 tw-text-[19px] tw-font-bold tw-tracking-tight"
      >
        {{ name }}
      </h2>
      <p
        v-if="title"
        class="tw-m-0 tw-truncate tw-text-[13px] tw-text-on-surface-variant"
      >
        {{ title }}
      </p>
      <p
        v-if="budget"
        class="tw-m-0 tw-mt-1.5 tw-text-[11px] tw-text-on-surface-variant"
      >
        Load {{ budget.loadLabel }}
      </p>
    </div>

    <div
      class="scrollbar-always-visible tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-y-auto tw-p-[18px]"
    >
      <div v-if="budget && budget.emplid !== null" class="tw-flex-none">
        <div class="tw-mb-1.5 tw-flex tw-items-center tw-gap-2">
          <FieldLabel class="tw-mb-0">{{ costLabel }} this term</FieldLabel>
          <span
            v-if="budget.isRateOverridden"
            class="tw-inline-flex tw-h-5 tw-items-center tw-rounded-full tw-bg-accent tw-px-2 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-accent"
          >
            Override
          </span>
        </div>
        <div
          class="tw-flex tw-items-center tw-gap-3 tw-rounded-[10px] tw-bg-surface tw-p-3"
        >
          <DollarInput
            class="tw-h-11 tw-w-36 tw-flex-none tw-overflow-hidden tw-rounded-[10px] tw-border tw-border-solid tw-bg-surface-bright"
            :class="
              budget.isRateOverridden
                ? 'tw-border-[#e0a800]'
                : 'tw-border-outline-variant'
            "
            :amount="budget.rate"
            :isDisabled="!canEditCosts"
            :label="`${costLabel} for ${name}`"
            @change="editRate"
          />
          <div class="tw-flex tw-flex-col tw-text-xs">
            <span class="tw-text-on-surface-variant">
              Standard rate: {{ standardRateLabel }}
            </span>
            <button
              v-if="canEditCosts && budget.isRateOverridden"
              type="button"
              class="tw-cursor-pointer tw-self-start tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary hover:tw-underline"
              @click="emit('editRate', null)"
            >
              Reset to rate
            </button>
          </div>
        </div>
      </div>

      <div class="tw-flex-none">
        <div class="tw-mb-1.5 tw-flex tw-items-center">
          <FieldLabel class="tw-mb-0">This term</FieldLabel>
          <span
            v-if="termTotal !== null"
            class="tw-ml-auto tw-text-[13px] tw-font-bold tw-tabular-nums"
          >
            {{ formatWholeDollars(termTotal) }}
          </span>
        </div>
        <p
          v-if="termSections.length === 0"
          class="tw-m-0 tw-text-[13px] tw-text-on-surface-variant"
        >
          No sections
        </p>
        <div class="tw-flex tw-flex-col tw-gap-2">
          <button
            v-for="termSection in termSections"
            :key="termSection.sectionId"
            type="button"
            class="tw-flex tw-cursor-pointer tw-items-center tw-gap-2.5 tw-rounded-[10px] tw-border-none tw-bg-surface tw-p-2.5 tw-text-left tw-text-on-surface hover:tw-bg-surface-container"
            @click="emit('selectSection', termSection.sectionId)"
          >
            <span
              class="tw-w-[3px] tw-flex-none tw-self-stretch tw-rounded-sm"
              :class="colorOfType(termSection.component).dot"
              aria-hidden="true"
            />
            <span class="tw-min-w-0 tw-flex-1">
              <span
                class="tw-block tw-truncate tw-text-[13px] tw-font-semibold"
              >
                {{ termSection.label }} · {{ termSection.title }}
              </span>
              <span
                class="tw-block tw-truncate tw-text-[11px] tw-text-on-surface-variant"
              >
                {{ termSection.meetingSummary
                }}{{ termSection.isTa ? " · TA" : "" }}
              </span>
              <span
                v-if="termSection.unpaidReason"
                class="tw-mt-1 tw-block tw-text-[11px] tw-text-on-surface-variant"
              >
                {{ termSection.unpaidReason }}
              </span>
            </span>
            <span
              v-if="termSection.amount !== undefined"
              class="tw-flex-none tw-text-[13px] tw-font-semibold tw-tabular-nums"
            >
              <MissingRate v-if="termSection.amount === null" />
              <template v-else>
                {{ formatWholeDollars(termSection.amount) }}
              </template>
            </span>
          </button>
        </div>
      </div>

      <div class="tw-flex-none tw-rounded-[10px] tw-bg-surface">
        <Disclosure label="Teaching history" :summary="historySummary">
          <p
            v-if="taughtTerms === null"
            class="tw-m-0 tw-text-xs tw-text-on-surface-variant"
          >
            Loading…
          </p>
          <p
            v-else-if="taughtTerms.length === 0"
            class="tw-m-0 tw-text-xs tw-text-on-surface-variant"
          >
            No sections in the last four years
          </p>
          <div
            v-else
            class="tw-grid tw-grid-cols-[auto_minmax(0,1fr)_auto] tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-[11.5px]"
          >
            <template v-for="term in taughtTerms" :key="term.termCode">
              <template
                v-for="(taught, index) in term.sections"
                :key="taught.key"
              >
                <span class="tw-text-on-surface-variant">
                  {{ index === 0 ? term.termName : "" }}
                </span>
                <span class="tw-truncate" :title="taught.title">
                  {{ taught.label }}{{ taught.isTa ? " (TA)" : "" }} ·
                  {{ taught.title }}
                </span>
                <span
                  class="tw-justify-self-end tw-rounded-sm tw-px-1.5 tw-py-0.5 tw-text-center tw-font-bold tw-tabular-nums tw-text-[#262626]"
                  :style="{ background: taught.fillColor }"
                >
                  {{ taught.enrolledOfCap ?? "—" }}
                </span>
              </template>
            </template>
          </div>
        </Disclosure>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import FieldLabel from "@/components/planning/FieldLabel.vue";
import { colorOfType } from "@/utils/meetingTypeColors";
import Disclosure from "./Disclosure.vue";
import DollarInput from "./budget/DollarInput.vue";
import MissingRate from "./budget/MissingRate.vue";
import { formatDollars, formatWholeDollars } from "../helpers/money";
import type { PersonRow } from "../helpers/peopleRows";
import type { PersonTermSection, TaughtTerm } from "../helpers/personPanel";

const props = defineProps<{
  name: string;
  title: string | null;
  /** Null outside the Budget view. */
  budget: PersonRow | null;
  costLabel: string;
  canEditCosts: boolean;
  termSections: PersonTermSection[];
  /** Null while loading. */
  taughtTerms: TaughtTerm[] | null;
}>();

const emit = defineEmits<{
  close: [];
  selectSection: [sectionId: number];
  editRate: [amount: number | null];
}>();

const standardRateLabel = computed(() => {
  const amount = props.budget?.rateWithoutOverride ?? null;
  return amount === null ? "none" : formatDollars(amount);
});

const termTotal = computed(() => props.budget?.total ?? null);

const historySummary = computed(() => {
  const [latest] = props.taughtTerms ?? [];
  if (!latest) return "";

  const count = latest.sections.length;
  return `${latest.termName} · ${count} ${count === 1 ? "section" : "sections"}`;
});

function editRate(amount: number | null) {
  const isStandard =
    amount === null || amount === props.budget?.rateWithoutOverride;
  emit("editRate", isStandard ? null : amount);
}
</script>
