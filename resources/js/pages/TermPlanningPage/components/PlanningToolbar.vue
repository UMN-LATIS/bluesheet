<!--
  The bar over the canvas: where a scheduler is (department, term), what they
  are looking at (the view switch), and whether the term takes edits at all.
  Everything here changes what the page is showing, and nothing here reads the
  schedule, so it does not take the editor.
-->
<template>
  <div class="tw-flex tw-min-w-0 tw-items-baseline tw-gap-2">
    <!-- On a phone the department and the view switch say where you
         are, and the bar has no width for a title as well. -->
    <span
      class="tw-hidden tw-truncate tw-text-[15px] tw-font-semibold tw-tracking-tight cramped:tw-block cramped:tw-text-base roomy:tw-text-[17px]"
    >
      Term Planning
    </span>
    <!-- A scheduler covering several departments moves between them
         here, rather than through the group page and back. -->
    <label class="tw-m-0 tw-min-w-0 tw-font-normal">
      <span class="tw-sr-only">Department</span>
      <select
        class="tw-max-w-[15rem] tw-cursor-pointer tw-truncate tw-border-none tw-bg-transparent tw-p-0 tw-text-[13px] tw-text-on-surface-variant hover:tw-text-on-surface"
        :value="groupId"
        @change="goToGroup(($event.target as HTMLSelectElement).value)"
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
    <!--
      Only where a panel has to be summoned. Docked, the filters are
      already on screen and a button to reveal them would say nothing.
    -->
    <button
      v-if="!isLarge"
      type="button"
      class="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-bg-surface-bright tw-px-3 tw-text-xs tw-font-semibold hover:tw-bg-surface roomy:tw-min-h-0 roomy:tw-py-1.5"
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

    <!-- A week of lanes cannot be read on a phone, so that one option
         drops out; the switch itself stays, since the day list and the
         heatmap are both worth having there. -->
    <div
      role="group"
      aria-label="View"
      class="tw-inline-flex tw-gap-0.5 tw-rounded-full tw-bg-outline-variant tw-p-0.5"
    >
      <button
        v-for="option in viewOptions"
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

    <label class="tw-m-0 tw-flex tw-items-center tw-font-normal">
      <span class="tw-sr-only">Term</span>
      <select
        class="tw-min-h-11 tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-py-1.5 tw-pl-3.5 tw-pr-8 tw-text-[13px] tw-font-semibold tw-text-on-surface roomy:tw-min-h-0"
        :value="term?.id"
        @change="goToTerm(($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="option in termOptions"
          :key="option.id"
          :value="option.id"
        >
          {{ labelOfTerm(option) }}
        </option>
      </select>
    </label>

    <!--
      Read-only is a property of the term, so it is named on the control
      that picks one. Below `cramped` the bar has no width to spare, and
      the strip under it says the same thing at greater length.
    -->
    <span
      v-if="isReadOnly"
      class="tw-hidden tw-flex-none tw-items-center tw-gap-1.5 cramped:tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-container tw-py-1 tw-pl-2 tw-pr-2.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
    >
      <LockIcon class="tw-h-3 tw-w-3 tw-flex-none" />
      Read only
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { omit, pick } from "lodash-es";
import { FilterIcon, LockIcon } from "@/icons";
import { useGroupQuery } from "../queries/useGroupQuery";
import { useSisGroupsQuery } from "../queries/useSisGroupsQuery";
import type { ScheduleView } from "../helpers/viewQuery";
import type { SisGroup, SisTerm } from "../types";
import { useScreenSize } from "../useScreenSize";

const props = defineProps<{
  groupId: number;
  termCode: number | null;
  /** The term on screen, which the switcher marks as chosen. */
  term: SisTerm | null;
  termOptions: SisTerm[];
  view: ScheduleView;
  isReadOnly: boolean;
  /** Across every facet, which is what the filter button's badge shows. */
  activeFilterCount: number;
  isFilterPanelOpen: boolean;
  /** Today, as "YYYY-MM-DD"; the term list marks the one we are inside. */
  today: string;
}>();

const emit = defineEmits<{
  selectView: [view: ScheduleView];
  openFilters: [];
}>();

const route = useRoute();
const router = useRouter();

const { isLarge, isSmall } = useScreenSize();

const VIEW_OPTIONS: { value: ScheduleView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "heatmap", label: "Heatmap" },
];

const viewOptions = computed(() =>
  VIEW_OPTIONS.filter((option) => !(isSmall.value && option.value === "week")),
);

/**
 * The query keys that name a row rather than a value: the `section` facet and
 * an open sheet's `sectionId` both hold section ids, and a section id belongs
 * to one term. Carried into another term it matches nothing, which empties the
 * schedule and, through `reachableFacetValues`, every other facet's list too.
 */
const TERM_BOUND_KEYS = ["section", "sectionId"];

// The rest of the filters ride along in the query, so a view narrowed to one
// person stays narrowed when the term changes.
const goToTerm = (termCode: string) =>
  router.push({
    name: "termPlanning",
    params: { groupId: props.groupId, termCode },
    query: omit(route.query, TERM_BOUND_KEYS),
  });

// The filters and any open sheet name this department's own courses and
// sections, so they are left behind. The view and the day are not: they are
// how a scheduler reads any department.
const goToGroup = (nextGroupId: string) =>
  router.push({
    name: "termPlanning",
    params: { groupId: nextGroupId, termCode: props.termCode ?? undefined },
    query: pick(route.query, ["view", "day"]),
  });

const groupId = computed(() => props.groupId);
const groupQuery = useGroupQuery(groupId);
const groupsQuery = useSisGroupsQuery();

/**
 * The department on screen leads the list even before it loads, so the
 * control never reads as empty and never as some other department.
 */
const departmentOptions = computed<SisGroup[]>(() => {
  const departments = groupsQuery.data.value ?? [];
  if (departments.some(({ id }) => id === props.groupId)) return departments;

  const current = groupQuery.data.value;
  return current
    ? [
        {
          id: props.groupId,
          name: current.group_title,
          abbreviation: current.abbreviation,
        },
        ...departments,
      ]
    : departments;
});

/**
 * "PSY - Psychology", or the code alone where the bar is too tight to spell it
 * out. Whichever half the group has, when it has only one.
 */
const labelOfDepartment = ({ name, abbreviation }: SisGroup) => {
  if (isSmall.value && abbreviation) return abbreviation;

  return [abbreviation, name].filter(Boolean).join(" - ") || "Department";
};

/** The term today falls inside, which is the one worth marking in the list. */
const isCurrent = (option: SisTerm) =>
  option.startDate !== null &&
  option.endDate !== null &&
  option.startDate <= props.today &&
  props.today <= option.endDate;

/** The term we are in is marked, unless the mark costs the bar too much. */
const labelOfTerm = (option: SisTerm) =>
  !isSmall.value && isCurrent(option)
    ? `${option.name} – Current`
    : option.name;
</script>
