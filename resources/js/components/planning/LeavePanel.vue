<template>
  <aside
    aria-label="Leave details"
    class="tw-flex tw-h-full tw-w-full tw-min-h-0 tw-flex-col tw-bg-surface-bright tw-text-on-surface"
  >
    <PanelHeader :title="title" :subtitle="subtitle" @close="emit('close')">
      <template v-if="leave && !draft" #tags>
        <LeaveStatusChip :status="leave.status" />
        <span class="tw-text-[11px] tw-text-on-surface-variant">
          {{ getLeaveTypeLabel(leave.type) }}
        </span>
      </template>
      <template v-if="!draft && terms.length > 0" #meta>
        <template v-for="(term, index) in terms" :key="term.termCode">
          <template v-if="index > 0">, </template>
          <TermPlanningLink
            :groupId="groupId"
            :termCode="term.termCode"
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
      <template v-if="draft">
        <div v-if="!leave">
          <FieldLabel>Person</FieldLabel>
          <PersonPicker
            :roster="roster"
            :emplid="draft.emplid"
            @choose="(emplid) => emit('edit', { emplid })"
          />
        </div>

        <LeaveFields
          :draft="draft"
          :payrollDates="payrollDates"
          @edit="(change) => emit('edit', change)"
        />

        <p
          v-if="refusal"
          class="tw-m-0 tw-rounded-lg tw-bg-error/10 tw-p-2.5 tw-text-[12.5px] tw-text-error"
        >
          {{ refusal }}
        </p>

        <div class="tw-flex tw-justify-end tw-gap-2">
          <Button
            variant="secondary"
            :disabled="isSaving"
            @click="emit('cancel')"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            :disabled="!isDraftValid || isSaving"
            @click="emit('save')"
          >
            {{ isSaving ? "Saving…" : "Save" }}
          </Button>
        </div>
      </template>

      <template v-else-if="leave">
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

        <ConfirmDelete
          v-if="isConfirmingDelete"
          @cancel="isConfirmingDelete = false"
          @confirm="
            isConfirmingDelete = false;
            emit('delete');
          "
        >
          Delete this leave? Its artifacts go with it.
        </ConfirmDelete>

        <div v-else-if="isEditable" class="tw-flex tw-gap-2">
          <Button variant="secondary" @click="emit('requestEdit')">Edit</Button>
          <Button variant="danger" @click="isConfirmingDelete = true">
            Delete
          </Button>
        </div>

        <p
          v-if="refusal"
          class="tw-m-0 tw-rounded-lg tw-bg-error/10 tw-p-2.5 tw-text-[12.5px] tw-text-error"
        >
          {{ refusal }}
        </p>

        <FieldDivider />

        <LeaveArtifactList
          :artifacts="artifacts"
          :isEditable="isEditable"
          @create="(payload) => emit('createArtifact', payload)"
          @save="
            (artifactId, payload) => emit('saveArtifact', artifactId, payload)
          "
          @delete="(artifactId) => emit('deleteArtifact', artifactId)"
        />

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
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ArrowRightIcon } from "@/icons";
import {
  leaveStatuses,
  type LeaveArtifact,
  type PlanningLeave,
  type PlanningPerson,
  type PlanningTerm,
  type SisEmployee,
  type TermPayrollDate,
} from "@/types";
import type { ArtifactPayload } from "@/api/leavePlanningApi";
import type { LeaveDraft } from "@/pages/LeavePlanningPage/useLeavePlanningView/types";
import { getLeaveTypeLabel } from "@/utils/leaveTypeHelpers";
import ConfirmDelete from "@/components/planning/ConfirmDelete.vue";
import FactValue from "@/components/planning/FactValue.vue";
import FieldDivider from "@/components/planning/FieldDivider.vue";
import FieldLabel from "@/components/planning/FieldLabel.vue";
import LeaveArtifactList from "@/components/planning/LeaveArtifactList.vue";
import LeaveFields from "@/components/planning/LeaveFields.vue";
import LeaveStatusChip from "@/components/planning/LeaveStatusChip.vue";
import Button from "@/components/Button.vue";
import PanelHeader from "@/components/planning/PanelHeader.vue";
import PersonPicker from "@/components/planning/PersonPicker.vue";
import TermPlanningLink from "@/components/planning/TermPlanningLink.vue";
import { formatDateRange } from "@/utils/dateLabels";
import { isEligibleWhenTenured } from "@/utils/leaveLabels";

const props = withDefaults(
  defineProps<{
    /** Null while a leave is being created, which has no row yet. */
    leave: PlanningLeave | null;
    person: PlanningPerson | undefined;
    otherLeaves: PlanningLeave[];
    terms: PlanningTerm[];
    groupId: number;
    canViewTermPlanning: boolean;
    /** Non-null puts the panel in edit mode. */
    draft?: LeaveDraft | null;
    isEditable?: boolean;
    isDraftValid?: boolean;
    isSaving?: boolean;
    refusal?: string | null;
    artifacts?: LeaveArtifact[];
    roster?: SisEmployee[];
    payrollDates?: TermPayrollDate[];
  }>(),
  {
    draft: null,
    isEditable: false,
    isDraftValid: false,
    isSaving: false,
    refusal: null,
    artifacts: () => [],
    roster: () => [],
    payrollDates: () => [],
  },
);

const emit = defineEmits<{
  close: [];
  selectLeave: [leaveId: number];
  requestEdit: [];
  edit: [change: Partial<LeaveDraft>];
  save: [];
  cancel: [];
  delete: [];
  createArtifact: [payload: ArtifactPayload];
  saveArtifact: [artifactId: number, payload: ArtifactPayload];
  deleteArtifact: [artifactId: number];
}>();

const isConfirmingDelete = ref(false);

watch(
  () => props.leave?.id,
  () => (isConfirmingDelete.value = false),
);

const title = computed(() => {
  if (!props.leave) return "New leave";
  return props.person ? `${props.person.name}’s leave` : "Leave";
});

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
