<!-- The editable twin of the facts LeavePanel shows. -->
<template>
  <div class="tw-flex tw-flex-col tw-gap-3.5">
    <div>
      <FieldLabel for="leave-description">Description</FieldLabel>
      <input
        id="leave-description"
        :value="draft.description"
        maxlength="255"
        placeholder="What this leave is for"
        class="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-2.5 tw-py-2 tw-text-[13.5px] tw-text-on-surface"
        @input="edit({ description: inputValue($event) })"
      />
    </div>

    <div>
      <FieldLabel for="leave-type">Type</FieldLabel>
      <select
        id="leave-type"
        :value="draft.type"
        class="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-2.5 tw-py-2 tw-text-[13.5px] tw-text-on-surface"
        @change="edit({ type: inputValue($event) as LeaveType })"
      >
        <option
          v-for="option in typeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.text }}
        </option>
      </select>
    </div>

    <div>
      <FieldLabel for="leave-status">Status</FieldLabel>
      <select
        id="leave-status"
        :value="draft.status"
        class="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-2.5 tw-py-2 tw-text-[13.5px] tw-text-on-surface"
        @change="edit({ status: inputValue($event) as LeaveStatus })"
      >
        <option
          v-for="option in statusOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.text }}
        </option>
      </select>
    </div>

    <div class="tw-flex tw-gap-3">
      <div class="tw-min-w-0 tw-flex-1">
        <FieldLabel>Starts</FieldLabel>
        <SelectLeaveDate
          variant="start"
          :modelValue="draft.startDate"
          :payrollDates="payrollDates"
          @update:modelValue="(date) => edit({ startDate: date ?? '' })"
        />
      </div>
      <div class="tw-min-w-0 tw-flex-1">
        <FieldLabel>Ends</FieldLabel>
        <SelectLeaveDate
          variant="end"
          :modelValue="draft.endDate"
          :payrollDates="payrollDates"
          :errorText="
            isEndAfterStart
              ? 'Invalid date'
              : 'End date must be after start date'
          "
          :validator="() => isEndAfterStart"
          @update:modelValue="(date) => edit({ endDate: date ?? '' })"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LeaveStatus, LeaveType, TermPayrollDate } from "@/types";
import FieldLabel from "@/components/planning/FieldLabel.vue";
import SelectLeaveDate from "@/components/LeavesTable/SelectLeaveDate.vue";
import { getLeaveStatusOptions } from "@/utils/leaveStatusHelpers";
import { getLeaveTypeOptions } from "@/utils/leaveTypeHelpers";
import type { LeaveDraft } from "@/pages/LeavePlanningPage/useLeavePlanningView/types";

const props = defineProps<{
  draft: LeaveDraft;
  payrollDates: TermPayrollDate[];
}>();

const emit = defineEmits<{ edit: [change: Partial<LeaveDraft>] }>();

const edit = (change: Partial<LeaveDraft>) => emit("edit", change);

const inputValue = (event: Event) =>
  (event.target as HTMLInputElement | HTMLSelectElement).value;

const typeOptions = computed(() => getLeaveTypeOptions());
const statusOptions = computed(() => getLeaveStatusOptions());

const isEndAfterStart = computed(
  () => props.draft.endDate > props.draft.startDate,
);
</script>
