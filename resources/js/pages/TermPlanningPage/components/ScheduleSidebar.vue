<template>
  <aside
    aria-label="Filters"
    class="tw-flex tw-h-full tw-w-full tw-flex-col tw-min-h-0 tw-bg-surface-bright"
  >
    <div
      v-if="isDismissible"
      class="tw-flex tw-flex-none tw-items-center tw-gap-2 tw-px-3.5 tw-pt-3"
    >
      <span class="tw-text-[13px] tw-font-bold">Filters</span>
      <button
        type="button"
        class="tw-ml-auto tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
        aria-label="Close filters"
        @click="emit('close')"
      >
        ×
      </button>
    </div>

    <div class="tw-flex-none tw-p-3.5 tw-pb-0">
      <label class="tw-sr-only" for="schedule-filter-search">
        Search courses, people, sections
      </label>
      <input
        id="schedule-filter-search"
        v-model="search"
        type="search"
        placeholder="Search courses, people, sections"
        class="tw-w-full tw-min-h-11 tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface tw-px-4 tw-text-[13px] tw-text-on-surface placeholder:tw-text-on-surface-variant focus:tw-border-primary focus:tw-bg-surface-bright focus:tw-outline-none"
      />
    </div>

    <div class="tw-flex-none tw-grid tw-grid-cols-2 tw-gap-2 tw-p-3.5 tw-pb-0">
      <button
        v-for="tile in tiles"
        :key="tile.facet"
        type="button"
        class="tw-relative tw-flex tw-min-h-14 tw-cursor-pointer tw-flex-col tw-items-start tw-gap-px tw-rounded-[10px] tw-border tw-border-solid tw-p-2 tw-px-3 tw-text-left"
        :class="
          activeFacet === tile.facet
            ? 'tw-border-primary tw-bg-primary-container'
            : 'tw-border-surface-container tw-bg-surface'
        "
        :aria-pressed="activeFacet === tile.facet"
        @click="activeFacet = tile.facet"
      >
        <span
          v-if="filters[tile.facet].length > 0"
          class="tw-absolute tw-right-1.5 tw-top-1.5 tw-rounded-full tw-bg-brand tw-px-1.5 tw-text-[10px] tw-font-semibold tw-leading-4 tw-text-white"
          :title="`${filters[tile.facet].length} filters active`"
        >
          {{ filters[tile.facet].length }}
        </span>
        <!-- What is checked here, or else what the list will show, out of
             what the term holds: "5/57". No slash where nothing narrows it. -->
        <span
          class="tw-text-[21px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-on-surface"
          >{{ tile.count }}&nbsp;<span
            v-if="tile.count !== tile.total"
            class="tw-text-[13px] tw-font-normal tw-text-on-surface-variant"
            >/&nbsp;{{ tile.total }}</span
          ></span
        >
        <span
          class="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
        >
          {{ tile.label }}
        </span>
      </button>
    </div>

    <!--
      Always on screen, disabled while there is nothing to clear, so the way
      out of a narrowed term is in the same place whether or not it is needed
      yet. A button that appears only once a filter is on has to be found.
    -->
    <div
      class="tw-flex tw-flex-none tw-items-center tw-gap-2 tw-px-3.5 tw-pt-3"
    >
      <span class="tw-text-[11.5px] tw-text-on-surface-variant">
        {{ narrowingSummary }}
      </span>
      <button
        type="button"
        class="tw-ml-auto tw-flex tw-min-h-8 tw-flex-none tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-px-3 tw-text-[11.5px] tw-font-semibold"
        :class="
          isNarrowed
            ? 'tw-cursor-pointer tw-border-primary tw-bg-primary-container tw-text-primary hover:tw-bg-primary hover:tw-text-on-primary'
            : 'tw-cursor-default tw-border-outline-variant tw-bg-transparent tw-text-on-surface-variant tw-opacity-60'
        "
        :disabled="!isNarrowed"
        @click="clearAll"
      >
        <XIcon class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
        Clear all
      </button>
    </div>

    <!--
      Narrowing a term is not changing it, so every control here keeps working
      on a read-only term. This one goes: it asks for work nobody can do.
    -->
    <div
      v-if="options.tba && options.tba.sectionCount > 0 && !schedule.isReadOnly"
      class="tw-mx-3.5 tw-mt-3 tw-flex tw-flex-none tw-items-center tw-gap-2 tw-rounded-[10px] tw-bg-brand/[0.06] tw-px-3 tw-py-2"
    >
      <span
        class="tw-h-[7px] tw-w-[7px] tw-flex-none tw-rounded-full tw-bg-brand"
        aria-hidden="true"
      />
      <span class="tw-text-[11.5px] tw-text-on-surface">
        {{ options.tba.sectionCount }}
        {{ options.tba.sectionCount === 1 ? "section" : "sections" }} still
        unassigned
      </span>
      <button
        type="button"
        class="tw-ml-auto tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[11.5px] tw-font-semibold tw-text-primary hover:tw-underline"
        @click="showUnassigned"
      >
        Show
      </button>
    </div>

    <div
      class="tw-flex tw-justify-between tw-flex-none tw-items-center tw-gap-2 tw-px-4 tw-pb-1.5 tw-pt-4"
    >
      <span
        class="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
      >
        {{ FACET_LABELS[activeFacet].list }}
      </span>
      <button
        v-if="filters[activeFacet].length > 0"
        type="button"
        class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[11px] tw-font-semibold tw-text-primary hover:tw-underline"
        @click="clearFacet(activeFacet)"
      >
        Clear
      </button>
    </div>

    <div
      class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-2.5 tw-pb-3"
    >
      <ul class="tw-m-0 tw-list-none tw-p-0">
        <template v-if="activeFacet === 'course'">
          <template v-for="level in courseLevels" :key="level.label">
            <!-- Sticky, so a scroller a long way down a level still knows
                 which one they are reading. -->
            <li class="tw-sticky tw-top-0 tw-z-10 tw-bg-surface-bright">
              <FilterRow
                isGroupHeading
                :isChecked="level.checkedCount === level.courses.length"
                :isIndeterminate="
                  level.checkedCount > 0 &&
                  level.checkedCount < level.courses.length
                "
                @toggle="
                  toggle(
                    'course',
                    level.courses.map(({ value }) => value),
                    $event,
                  )
                "
              >
                {{ level.label }}
                <template #annotation>{{ level.courses.length }}</template>
              </FilterRow>
            </li>
            <li v-for="course in level.courses" :key="course.value">
              <FilterRow
                :isChecked="isChecked('course', course.value)"
                @toggle="toggle('course', [course.value], $event)"
              >
                {{ course.code }}
                <template #secondary>{{ course.title }}</template>
                <template #annotation>{{ course.sectionCount }} sec</template>
              </FilterRow>
            </li>
          </template>
        </template>

        <template v-else-if="activeFacet === 'person'">
          <li v-for="person in people" :key="person.value">
            <FilterRow
              :isChecked="isChecked('person', person.value)"
              @toggle="toggle('person', [person.value], $event)"
            >
              <span
                :class="{
                  'tw-font-semibold tw-text-brand': person.value === TBA_PERSON,
                }"
              >
                {{ person.listName }}
              </span>
              <template v-if="person.internetId" #secondary>
                {{ person.internetId }}@umn.edu
              </template>
              <template v-else-if="person.value === TBA_PERSON" #secondary>
                No instructor assigned
              </template>
              <template #annotation>{{ person.sectionCount }} sec</template>
            </FilterRow>
          </li>
        </template>

        <template v-else-if="activeFacet === 'section'">
          <li v-for="section in sections" :key="section.value">
            <FilterRow
              :isChecked="isChecked('section', section.value)"
              @toggle="toggle('section', [section.value], $event)"
            >
              {{ section.label }}
              <template #secondary>
                {{ section.component
                }}<template v-if="section.instructorLastName">
                  · {{ section.instructorLastName }}</template
                >
              </template>
              <template #annotation>{{ section.days }}</template>
            </FilterRow>
          </li>
        </template>

        <template v-else-if="activeFacet === 'component'">
          <li v-for="component in components" :key="component.value">
            <FilterRow
              :isChecked="isChecked('component', component.value)"
              :swatch="colorOfType(component.value).dot"
              @toggle="toggle('component', [component.value], $event)"
            >
              {{ component.value }}
              <template #secondary>{{
                labelOfComponent(component.value)
              }}</template>
              <template #annotation>{{ component.sectionCount }}</template>
            </FilterRow>
          </li>
        </template>
      </ul>

      <p
        v-if="isListEmpty"
        class="tw-m-0 tw-px-2 tw-py-6 tw-text-center tw-text-[11.5px] tw-text-on-surface-variant"
      >
        Nothing here matches the filters.
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import FilterRow from "./FilterRow.vue";
import { XIcon } from "@/icons";
import { colorOfType, labelOfComponent } from "../constants/meetingTypeColors";
import type {
  CourseOption,
  FilterOptions,
  PersonOption,
} from "../helpers/filterOptions";
import type { ReachableFacetValues } from "../helpers/scheduleFilters";
import { type FilterFacet, TBA_PERSON } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

const props = defineProps<{
  options: FilterOptions;
  schedule: ScheduleEditor;
  /** Per facet, the values the other facets' checked values leave standing. */
  reachable: ReachableFacetValues;
  /** Mounted as an overlay that can be closed, rather than docked. */
  isDismissible?: boolean;
}>();

const emit = defineEmits<{ close: [] }>();

const search = ref("");
const activeFacet = ref<FilterFacet>("course");

const filters = computed(() => props.schedule.filters);

const isChecked = (facet: FilterFacet, value: string) =>
  filters.value[facet].includes(value);

const toggle = (facet: FilterFacet, values: string[], isNowChecked: boolean) =>
  isNowChecked
    ? props.schedule.addFilterValues(facet, values)
    : props.schedule.removeFilterValues(facet, values);

/** Across every facet, not just the list in view. */
const activeFilterCount = computed(() =>
  Object.values(filters.value).reduce((sum, values) => sum + values.length, 0),
);

const clearFacet = (facet: FilterFacet) =>
  props.schedule.removeFilterValues(facet, filters.value[facet]);

const isSearching = computed(() => search.value.trim() !== "");

/** Whether anything at all is holding sections back from the schedule. */
const isNarrowed = computed(
  () => activeFilterCount.value > 0 || isSearching.value,
);

/** The search narrows the lists as a checked value does, so it clears too. */
const clearAll = () => {
  search.value = "";
  props.schedule.clearFilters();
};

const narrowingSummary = computed(() => {
  const filterPhrase =
    activeFilterCount.value === 1
      ? "1 filter"
      : `${activeFilterCount.value} filters`;

  if (activeFilterCount.value > 0) {
    return isSearching.value
      ? `${filterPhrase} and a search active`
      : `${filterPhrase} active`;
  }
  return isSearching.value ? "Search active" : "No filters active";
});

const showUnassigned = () => {
  activeFacet.value = "person";
  props.schedule.addFilterValues("person", [TBA_PERSON]);
};

/**
 * A row is listed when the search matches it and the other facets leave it
 * standing: check "LEC" and the course list keeps the courses that hold a
 * lecture. A checked row is listed whatever either says, so it can always be
 * unchecked.
 */
const isInView = (facet: FilterFacet, value: string, text: string) => {
  if (isChecked(facet, value)) return true;
  if (!props.reachable[facet].has(value)) return false;

  const query = search.value.trim().toLowerCase();
  return query === "" || text.toLowerCase().includes(query);
};

/**
 * How a facet names itself in each of the two places it is named. Only the
 * meeting types differ: the tile has room for one word, the heading over the
 * open list has room to say which kind of type it means.
 */
const FACET_LABELS: Record<FilterFacet, { tile: string; list: string }> = {
  course: { tile: "Courses", list: "Courses" },
  person: { tile: "Faculty", list: "Faculty" },
  section: { tile: "Sections", list: "Sections" },
  component: { tile: "Types", list: "Meeting type" },
};

/**
 * `shown` is how many rows the list below holds, which the search and the
 * checked values of the *other* facets both narrow. `total` is what the term
 * holds. A facet with checked values shows that count in place of `shown`, so
 * "4 / 137" reads the same as the badge above it.
 */
const tiles = computed(() =>
  [
    {
      facet: "course" as const,
      shown: courseLevels.value.reduce(
        (sum, level) => sum + level.courses.length,
        0,
      ),
      total: props.options.courseLevels.reduce(
        (sum, level) => sum + level.courses.length,
        0,
      ),
    },
    {
      facet: "person" as const,
      shown: people.value.length,
      total: props.options.faculty.length + (props.options.tba ? 1 : 0),
    },
    {
      facet: "section" as const,
      shown: sections.value.length,
      total: props.options.sections.length,
    },
    {
      facet: "component" as const,
      shown: components.value.length,
      total: props.options.components.length,
    },
  ].map((tile) => ({
    ...tile,
    label: FACET_LABELS[tile.facet].tile,
    count:
      filters.value[tile.facet].length > 0
        ? filters.value[tile.facet].length
        : tile.shown,
  })),
);

const courseLevels = computed(() =>
  props.options.courseLevels
    .map((level) => {
      const courses = level.courses.filter((course: CourseOption) =>
        isInView("course", course.value, `${course.code} ${course.title}`),
      );
      return {
        ...level,
        courses,
        checkedCount: courses.filter(({ value }) => isChecked("course", value))
          .length,
      };
    })
    .filter((level) => level.courses.length > 0),
);

/** TBA heads the list: it is the row a scheduler most often needs to find. */
const people = computed(() => {
  const { tba, faculty } = props.options;
  const listed: PersonOption[] = tba ? [tba, ...faculty] : faculty;
  return listed.filter((person) =>
    isInView(
      "person",
      person.value,
      `${person.name} ${person.emplid ?? ""} ${person.internetId ?? ""}`,
    ),
  );
});

const sections = computed(() =>
  props.options.sections.filter((section) =>
    isInView(
      "section",
      section.value,
      `${section.label} ${section.component} ${section.instructorLastName ?? ""}`,
    ),
  ),
);

const components = computed(() =>
  props.options.components.filter((component) =>
    isInView("component", component.value, component.value),
  ),
);

const isListEmpty = computed(
  () =>
    tiles.value.find((tile) => tile.facet === activeFacet.value)?.shown === 0,
);
</script>
