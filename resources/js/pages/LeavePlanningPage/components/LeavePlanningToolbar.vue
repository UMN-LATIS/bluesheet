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
    <button
      v-if="!isLarge"
      type="button"
      class="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-bg-surface-bright tw-px-3 tw-text-xs tw-font-semibold hover:tw-bg-surface"
      :class="
        activeFilterCount > 0
          ? 'tw-border-primary tw-text-primary'
          : 'tw-border-outline tw-text-on-surface'
      "
      :aria-expanded="isFilterPanelOpen"
      aria-label="Filters"
      title="Filters"
      @click="emit('openFilters')"
    >
      <FilterIcon aria-hidden="true" />
      <span
        v-if="activeFilterCount > 0"
        class="tw-rounded-full tw-bg-primary tw-px-1.5 tw-text-[10px] tw-leading-4 tw-text-on-primary"
      >
        {{ activeFilterCount }}
      </span>
    </button>

    <button
      v-if="canViewCourses"
      type="button"
      :aria-pressed="isHistoryShown"
      class="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-bg-surface-bright tw-py-1.5 tw-pl-2 tw-pr-3 tw-text-xs tw-font-semibold hover:tw-bg-surface roomy:tw-min-h-0"
      :class="
        isHistoryShown
          ? 'tw-border-primary tw-text-primary'
          : 'tw-border-outline tw-text-on-surface'
      "
      @click="emit('toggleHistory')"
    >
      <span
        aria-hidden="true"
        class="tw-relative tw-h-4 tw-w-[26px] tw-flex-none tw-rounded-full"
        :class="isHistoryShown ? 'tw-bg-primary' : 'tw-bg-outline-variant'"
      >
        <span
          class="tw-absolute tw-top-0.5 tw-h-3 tw-w-3 tw-rounded-full tw-bg-surface-bright tw-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          :class="isHistoryShown ? 'tw-left-3' : 'tw-left-0.5'"
        />
      </span>
      Teaching history
    </button>

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

    <div class="tw-flex tw-items-center tw-gap-1.5">
      <TermSelect
        label="First term"
        :terms="termOptions"
        :termCode="range?.startTermCode ?? null"
        @choose="emit('selectRangeStart', $event)"
      />
      <span class="tw-text-[13px] tw-text-on-surface-variant">–</span>
      <TermSelect
        label="Last term"
        :terms="termOptions"
        :termCode="range?.endTermCode ?? null"
        @choose="emit('selectRangeEnd', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { pick } from "lodash-es";
import { FilterIcon } from "@/icons";
import type { PlanningGroup, PlanningTerm, PlanningTermRange } from "@/types";
import { useScreenSize } from "@/utils/useScreenSize";
import TermSelect from "./TermSelect.vue";
import { isDated } from "../helpers/timelineAxis";
import { useGroupQuery } from "../queries/useGroupQuery";
import { useLeavePlanningGroupsQuery } from "../queries/useLeavePlanningGroupsQuery";
import type { TeachingView } from "../useLeavePlanningView/types";

const props = defineProps<{
  groupId: number;
  terms: PlanningTerm[];
  range: PlanningTermRange | null;
  canViewCourses: boolean;
  isHistoryShown: boolean;
  view: TeachingView;
  activeFilterCount: number;
  isFilterPanelOpen: boolean;
}>();

const emit = defineEmits<{
  openFilters: [];
  toggleHistory: [];
  selectView: [view: TeachingView];
  selectRangeStart: [termCode: number];
  selectRangeEnd: [termCode: number];
}>();

const VIEW_OPTIONS: { value: TeachingView; label: string }[] = [
  { value: "instructors", label: "Instructors" },
  { value: "tas", label: "TAs" },
  { value: "courses", label: "Courses" },
];

const route = useRoute();
const router = useRouter();
const { isLarge, isSmall } = useScreenSize();

const termOptions = computed(() =>
  props.terms.filter(isDated).sort((a, b) => a.termCode - b.termCode),
);

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
