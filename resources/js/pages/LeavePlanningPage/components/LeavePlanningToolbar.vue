<template>
  <div class="tw-flex tw-min-w-0 tw-items-baseline tw-gap-2">
    <span
      class="tw-hidden tw-truncate tw-text-[15px] tw-font-semibold tw-tracking-tight cramped:tw-block cramped:tw-text-base roomy:tw-text-[17px]"
    >
      Leave Planning
    </span>
    <label class="tw-m-0 tw-min-w-0 tw-font-normal">
      <span class="tw-sr-only">Department</span>
      <select
        class="tw-max-w-[15rem] tw-cursor-pointer tw-truncate tw-border-none tw-bg-transparent tw-p-0 tw-text-[13px] tw-text-on-surface-variant hover:tw-text-on-surface"
        :value="groupId"
        @change="chooseGroup"
      >
        <option
          v-for="option in departmentOptions"
          :key="option.id"
          :value="option.id"
        >
          {{ labelOfDepartment(option) }}
        </option>
      </select>
    </label>
  </div>

  <div class="tw-ml-auto tw-flex tw-flex-none tw-items-center tw-gap-2.5">
    <div
      v-if="isHistoryShown"
      role="group"
      aria-label="View"
      class="tw-inline-flex tw-gap-0.5 tw-rounded-full tw-bg-outline-variant tw-p-0.5"
    >
      <button
        v-for="option in VIEW_OPTIONS"
        :key="option.value"
        type="button"
        class="tw-cursor-pointer tw-rounded-full tw-border-none tw-px-3.5 tw-py-1.5 tw-text-xs tw-font-semibold"
        :class="
          view === option.value
            ? 'tw-bg-surface-bright tw-text-on-surface tw-shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
            : 'tw-bg-transparent tw-text-on-surface-variant hover:tw-text-on-surface'
        "
        :aria-pressed="view === option.value"
        @click="emit('selectView', option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <Button
      v-if="canCreateLeaves"
      variant="secondary"
      class="tw-text-xs"
      @click="emit('createLeave')"
    >
      Create Leave
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/Button.vue";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { pick } from "lodash-es";
import type { PlanningGroup, PlanningTerm } from "@/types";
import { useScreenSize } from "@/utils/useScreenSize";
import { useGroupQuery } from "../queries/useGroupQuery";
import { useLeavePlanningGroupsQuery } from "../queries/useLeavePlanningGroupsQuery";
import type { TeachingView } from "../useLeavePlanningView/types";

const props = defineProps<{
  groupId: number;
  terms: PlanningTerm[];
  canViewCourses: boolean;
  canCreateLeaves: boolean;
  isHistoryShown: boolean;
  view: TeachingView;
}>();

const emit = defineEmits<{
  createLeave: [];
  selectView: [view: TeachingView];
}>();

const VIEW_OPTIONS: { value: TeachingView; label: string }[] = [
  { value: "instructors", label: "Instructors" },
  { value: "tas", label: "TAs" },
  { value: "courses", label: "Courses" },
];

const route = useRoute();
const router = useRouter();
const { isSmall } = useScreenSize();

function chooseGroup(event: Event) {
  const select = event.target as HTMLSelectElement;
  router.push({
    name: "leavePlanning",
    params: { groupId: select.value },
    // Keep only these keys: filters and a selection name
    // this department's people, and match nothing in
    // another one.
    query: pick(route.query, ["start", "end", "history", "view"]),
  });
}

const groupId = computed(() => props.groupId);
const groupsQuery = useLeavePlanningGroupsQuery();
const isGroupMissingFromList = computed(
  () =>
    groupsQuery.isSuccess.value &&
    !(groupsQuery.data.value ?? []).some(({ id }) => id === props.groupId),
);
const groupQuery = useGroupQuery(groupId, isGroupMissingFromList);

const departmentOptions = computed<PlanningGroup[]>(() => {
  const departments = groupsQuery.data.value ?? [];
  if (departments.some(({ id }) => id === props.groupId)) return departments;

  const currentGroup = groupQuery.data.value;
  if (!currentGroup) return departments;

  const currentDepartment = {
    id: props.groupId,
    name: currentGroup.group_title,
    abbreviation: currentGroup.abbreviation,
  };
  return [currentDepartment, ...departments];
});

const labelOfDepartment = ({ name, abbreviation }: PlanningGroup) => {
  if (isSmall.value && abbreviation) return abbreviation;
  return [abbreviation, name].filter(Boolean).join(" - ") || "Department";
};
</script>
