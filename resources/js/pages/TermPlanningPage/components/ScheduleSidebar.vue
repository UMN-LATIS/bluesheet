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
        <span
          class="tw-text-[21px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-on-surface"
        >
          {{ tile.count }}
        </span>
        <span
          class="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
        >
          {{ tile.label }}
        </span>
      </button>
    </div>

    <div
      v-if="activeFilterCount > 0"
      class="tw-flex tw-flex-none tw-items-center tw-gap-2 tw-px-3.5 tw-pt-3"
    >
      <span class="tw-text-[11.5px] tw-text-on-surface-variant">
        {{ activeFilterCount }}
        {{ activeFilterCount === 1 ? "filter" : "filters" }} active
      </span>
      <button
        type="button"
        class="tw-ml-auto tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[11.5px] tw-font-semibold tw-text-primary hover:tw-underline"
        @click="schedule.clearFilters()"
      >
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
      class="tw-flex tw-flex-none tw-items-center tw-gap-2 tw-px-4 tw-pb-1.5 tw-pt-4"
    >
      <span
        class="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
      >
        {{ listHeader.title }}
      </span>
      <button
        v-if="filters[activeFacet].length > 0"
        type="button"
        class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[11px] tw-font-semibold tw-text-primary hover:tw-underline"
        @click="clearFacet(activeFacet)"
      >
        Clear
      </button>
      <span class="tw-ml-auto tw-text-[11px] tw-text-on-surface-variant">
        {{ listHeader.countPhrase }}
      </span>
    </div>

    <div
      class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-2.5 tw-pb-3"
    >
      <ul class="tw-m-0 tw-list-none tw-p-0">
        <template v-if="activeFacet === 'course'">
          <template v-for="level in courseLevels" :key="level.label">
            <li>
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
                isIndented
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
                {{ person.name }}
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
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import FilterRow from "./FilterRow.vue";
import { colorOfType, labelOfComponent } from "../constants/meetingTypeColors";
import type {
  CourseOption,
  FilterOptions,
  PersonOption,
} from "../helpers/filterOptions";
import { type FilterFacet, TBA_PERSON } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

const props = defineProps<{
  options: FilterOptions;
  schedule: ScheduleEditor;
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

const showUnassigned = () => {
  activeFacet.value = "person";
  props.schedule.addFilterValues("person", [TBA_PERSON]);
};

// a checked row stays in view whatever the search says, so it can be unchecked
const isInView = (facet: FilterFacet, value: string, text: string) => {
  const query = search.value.trim().toLowerCase();
  return (
    query === "" ||
    isChecked(facet, value) ||
    text.toLowerCase().includes(query)
  );
};

// term totals for the tiles and the list header, so the search box never
// changes what a scheduler expects those numbers to mean
const courseCount = computed(() =>
  props.options.courseLevels.reduce(
    (sum, level) => sum + level.courses.length,
    0,
  ),
);
const facultyCount = computed(
  () => props.options.faculty.length + (props.options.tba ? 1 : 0),
);
const sectionCount = computed(() => props.options.sections.length);
const componentCount = computed(() => props.options.components.length);

const tiles = computed(() => [
  { facet: "course" as const, label: "Courses", count: courseCount.value },
  { facet: "person" as const, label: "Faculty", count: facultyCount.value },
  { facet: "section" as const, label: "Sections", count: sectionCount.value },
  { facet: "component" as const, label: "Types", count: componentCount.value },
]);

const listHeader = computed(
  () =>
    ({
      course: {
        title: "Courses",
        countPhrase: `${courseCount.value} in this term`,
      },
      person: {
        title: "Faculty",
        countPhrase: `${facultyCount.value} on the roster`,
      },
      section: {
        title: "Sections",
        countPhrase: `${sectionCount.value} in this term`,
      },
      component: {
        title: "Meeting type",
        countPhrase: "the key to the schedule",
      },
    })[activeFacet.value],
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
</script>
