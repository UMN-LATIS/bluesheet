<template>
  <aside
    aria-label="Leave details"
    class="tw-flex tw-h-full tw-w-full tw-min-h-0 tw-flex-col tw-bg-surface-bright tw-text-on-surface"
  >
    <PanelHeader
      :title="person?.name || 'Unknown person'"
      :subtitle="subtitle"
      @close="emit('close')"
    >
      <template #tags>
        <LeaveStatusChip :status="leave.status" />
        <span class="tw-text-[11px] tw-text-on-surface-variant">
          {{ getLeaveTypeLabel(leave.type) }}
        </span>
      </template>
      <template v-if="terms.length > 0" #meta>
        <template v-for="(term, index) in terms" :key="term.id">
          <template v-if="index > 0">, </template>
          <TermPlanningLink
            :groupId="groupId"
            :termId="term.id"
            :canViewTermPlanning="canViewTermPlanning"
            :class="{
              'tw-text-primary hover:tw-underline': canViewTermPlanning,
            }"
          >
            {{ term.name }}
          </TermPlanningLink>
        </template>
      </template>
    </PanelHeader>

    <div
      class="scrollbar-always-visible tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-y-auto tw-p-[18px]"
    >
      <div>
        <FieldLabel class="tw-mb-px">Dates</FieldLabel>
        <div class="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2">
          <FactValue>
            {{ formatDateRange(leave.startDate, leave.endDate) }}
          </FactValue>
          <span class="tw-text-xs tw-text-on-surface-variant">
            {{ terms.length }}
            {{ terms.length === 1 ? "term" : "terms" }}
          </span>
        </div>
      </div>

      <div v-if="isEligibleWhenTenured(leave, person)">
        <FieldLabel class="tw-mb-px">Eligibility</FieldLabel>
        <p class="tw-m-0 tw-text-[13.5px]">Eligible when tenured</p>
      </div>

      <div v-if="leave.description">
        <FieldLabel class="tw-mb-px">Description</FieldLabel>
        <p class="tw-m-0 tw-text-[13.5px] tw-leading-snug">
          {{ leave.description }}
        </p>
      </div>

      <div v-if="eligibilityTags.length > 0">
        <FieldLabel>Eligible for</FieldLabel>
        <div class="tw-flex tw-flex-wrap tw-gap-1.5">
          <span
            v-for="tag in eligibilityTags"
            :key="tag"
            class="tw-inline-flex tw-h-5 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface tw-px-2 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-on-surface-variant"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <template v-if="otherLeaves.length > 0">
        <FieldDivider />
        <div>
          <FieldLabel>Other leaves in range</FieldLabel>
          <ul class="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1 tw-p-0">
            <li v-for="other in otherLeaves" :key="other.id">
              <button
                type="button"
                class="tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-1 tw-text-left hover:tw-bg-surface"
                @click="emit('selectLeave', other.id)"
              >
                <LeaveStatusChip :status="other.status" />
                <span
                  class="tw-truncate tw-text-[13px]"
                  :class="{
                    'tw-text-on-surface-variant tw-line-through':
                      other.status === leaveStatuses.DEFERRED,
                  }"
                >
                  {{ getLeaveTypeLabel(other.type) }}
                </span>
                <span
                  class="tw-ms-auto tw-flex-none tw-text-[11px] tw-text-on-surface-variant"
                >
                  {{ formatDateRange(other.startDate, other.endDate) }}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </template>

      <router-link
        :to="{
          name: 'user',
          params: { userId: leave.userId },
          query: { showPastLeaves: 'true' },
        }"
        class="tw-mt-auto tw-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-text-primary"
      >
        Open {{ person?.name || "this person" }}’s leaves
        <ArrowRightIcon class="!tw-h-3.5 !tw-w-3.5" aria-hidden="true" />
      </router-link>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowRightIcon } from "@/icons";
import {
  leaveStatuses,
  type PlanningLeave,
  type PlanningPerson,
  type PlanningTerm,
} from "@/types";
import { getLeaveTypeLabel } from "@/utils/leaveTypeHelpers";
import FactValue from "@/components/planning/FactValue.vue";
import FieldDivider from "@/components/planning/FieldDivider.vue";
import FieldLabel from "@/components/planning/FieldLabel.vue";
import LeaveStatusChip from "@/components/planning/LeaveStatusChip.vue";
import PanelHeader from "@/components/planning/PanelHeader.vue";
import TermPlanningLink from "@/components/planning/TermPlanningLink.vue";
import { formatDateRange } from "@/utils/dateLabels";
import { isEligibleWhenTenured } from "@/utils/leaveLabels";

const props = defineProps<{
  leave: PlanningLeave;
  person: PlanningPerson | undefined;
  otherLeaves: PlanningLeave[];
  terms: PlanningTerm[];
  groupId: number;
  canViewTermPlanning: boolean;
}>();

const emit = defineEmits<{
  close: [];
  selectLeave: [leaveId: number];
}>();

const subtitle = computed(() =>
  [props.person?.title, props.person?.categories.join(", ")]
    .filter(Boolean)
    .join(" · "),
);

const ELIGIBILITY_TAGS: {
  label: string;
  isEligible: (person: PlanningPerson) => boolean;
}[] = [
  { label: "SSL", isEligible: (person) => person.sslEligible },
  { label: "SSL apply", isEligible: (person) => person.sslApplyEligible },
  { label: "Midcareer", isEligible: (person) => person.midcareerEligible },
];

const eligibilityTags = computed(() => {
  const { person } = props;
  if (!person) return [];
  return ELIGIBILITY_TAGS.filter(({ isEligible }) => isEligible(person)).map(
    ({ label }) => label,
  );
});
</script>
