<template>
  <!--
    Collapsed, the sidebar is a rail: the same column, narrowed to its
    expand button, so the control to bring the filters back sits exactly
    where the filters were. A badge on the rail says how many filter values
    are still narrowing the grid while the sidebar is out of view.
  -->
  <aside
    v-if="isCollapsed"
    aria-label="Filters, collapsed"
    class="tw-flex tw-min-h-0 tw-flex-col tw-items-center tw-gap-2 tw-bg-surface tw-py-1.5"
  >
    <button
      type="button"
      :class="ICON_BUTTON_CLASS"
      aria-label="Show filters"
      title="Show filters"
      @click="isCollapsed = false"
    >
      <i class="fas fa-angle-double-right" aria-hidden="true" />
    </button>
    <span
      v-if="activeFilterCount > 0"
      class="tw-rounded-full tw-bg-umn-maroon tw-px-1.5 tw-text-[0.65rem] tw-font-semibold tw-leading-4 tw-text-white"
      :title="`${activeFilterCount} active filters`"
    >
      {{ activeFilterCount }}
    </span>
  </aside>

  <aside
    v-else
    aria-label="Filters"
    class="tw-flex tw-min-h-0 tw-flex-col tw-bg-surface"
  >
    <!-- Same height as the toolbar over the grid, so the two read as one band. -->
    <div class="tw-flex tw-h-9 tw-flex-none tw-items-center tw-px-1.5">
      <button
        type="button"
        :class="ICON_BUTTON_CLASS"
        aria-label="Hide filters"
        title="Hide filters"
        @click="isCollapsed = true"
      >
        <i class="fas fa-angle-double-left" aria-hidden="true" />
      </button>
    </div>

    <div class="tw-flex-none tw-p-3">
      <label class="tw-sr-only" for="schedule-filter-search">
        Search courses, people, sections
      </label>
      <input
        id="schedule-filter-search"
        v-model="search"
        type="search"
        placeholder="Search courses, people, sections"
        class="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-surface-bright tw-px-3 tw-py-1.5 tw-text-xs tw-text-on-surface placeholder:tw-text-on-surface-variant focus:tw-border-primary focus:tw-outline-none"
      />
    </div>

    <!--
      Short groups keep their full height, so several of them at once can
      outgrow the column; then the column scrolls rather than clipping.
    -->
    <div class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto">
      <FilterGroup
        v-if="courseLevels.length > 0"
        title="Courses"
        :count="courseCount"
        :checkedCount="filters.course.length"
        @clear="clearFacet('course')"
      >
        <template v-for="level in courseLevels" :key="level.label">
          <!-- Pinned to the top of the group's scroll box as its courses go past. -->
          <div class="tw-sticky tw-top-0 tw-z-10 tw-bg-surface">
            <FilterRow
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
              <span
                class="tw-font-semibold tw-uppercase tw-tracking-wide tw-text-neutral-600"
              >
                {{ level.label }}
              </span>
              <template #annotation>{{ level.courses.length }}</template>
            </FilterRow>
          </div>
          <FilterRows :items="level.courses">
            <template #default="{ item }">
              <FilterRow
                :isChecked="isChecked('course', item.value)"
                @toggle="toggle('course', [item.value], $event)"
              >
                <span class="tw-block">{{ item.code }}</span>
                <span
                  class="tw-block tw-truncate tw-text-[11px] tw-text-neutral-500"
                >
                  {{ item.title }}
                </span>
                <template #annotation>
                  <template v-if="item.credits !== null">
                    {{ item.credits }} cr ·
                  </template>
                  {{ item.sectionCount }}
                </template>
              </FilterRow>
            </template>
          </FilterRows>
        </template>
      </FilterGroup>

      <FilterGroup
        v-if="people.length > 0"
        title="Faculty"
        :count="people.length"
        :checkedCount="filters.person.length"
        @clear="clearFacet('person')"
      >
        <FilterRows :items="people">
          <template #default="{ item }">
            <FilterRow
              :isChecked="isChecked('person', item.value)"
              @toggle="toggle('person', [item.value], $event)"
            >
              <span
                class="tw-block tw-truncate"
                :class="{
                  'tw-font-semibold tw-text-umn-maroon':
                    item.value === TBA_PERSON,
                }"
              >
                {{ item.name }}
              </span>
              <span
                v-if="item.emplid !== null"
                class="tw-block tw-truncate tw-text-[11px] tw-text-neutral-500"
              >
                {{ item.emplid }}
                <template v-if="item.internetId">
                  • {{ item.internetId }}@umn.edu
                </template>
              </span>
              <template #annotation>{{ item.sectionCount }} sec</template>
            </FilterRow>
          </template>
        </FilterRows>
      </FilterGroup>

      <FilterGroup
        v-if="sections.length > 0"
        title="Sections"
        :count="sections.length"
        :checkedCount="filters.section.length"
        @clear="clearFacet('section')"
      >
        <FilterRows :items="sections">
          <template #default="{ item }">
            <FilterRow
              :isChecked="isChecked('section', item.value)"
              @toggle="toggle('section', [item.value], $event)"
            >
              {{ item.label }}
              <template #annotation>
                {{ item.component }}
                <template v-if="item.instructorLastName">
                  · {{ item.instructorLastName }}
                </template>
              </template>
            </FilterRow>
          </template>
        </FilterRows>
      </FilterGroup>

      <FilterGroup
        v-if="components.length > 0"
        title="Type"
        :count="components.length"
        :checkedCount="filters.component.length"
        @clear="clearFacet('component')"
      >
        <FilterRows :items="components">
          <template #default="{ item }">
            <FilterRow
              :isChecked="isChecked('component', item.value)"
              @toggle="toggle('component', [item.value], $event)"
            >
              {{ item.value }}
              <template #annotation>{{ item.sectionCount }}</template>
            </FilterRow>
          </template>
        </FilterRows>
      </FilterGroup>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import FilterGroup from "./FilterGroup.vue";
import FilterRow from "./FilterRow.vue";
import FilterRows from "./FilterRows.vue";
import type {
  CourseOption,
  FilterOptions,
  PersonOption,
} from "../helpers/filterOptions";
import { type FilterFacet, TBA_PERSON } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

/**
 * The lists a user narrows the grid with. Every checkbox here is a filter
 * event on the schedule; the sidebar keeps nothing of its own but the search
 * text, which only decides which rows are in view.
 */
const props = defineProps<{
  options: FilterOptions;
  schedule: ScheduleEditor;
}>();

/** Whether the sidebar is folded to its rail. The page sizes the column. */
const isCollapsed = defineModel<boolean>("isCollapsed", { default: false });

const ICON_BUTTON_CLASS =
  "tw-flex tw-h-7 tw-w-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-on-surface-variant hover:tw-bg-surface-container-high hover:tw-text-on-surface";

const search = ref("");

const filters = computed(() => props.schedule.filters);

const activeFilterCount = computed(() =>
  Object.values(filters.value).reduce((sum, values) => sum + values.length, 0),
);

const isChecked = (facet: FilterFacet, value: string) =>
  filters.value[facet].includes(value);

const toggle = (facet: FilterFacet, values: string[], isNowChecked: boolean) =>
  isNowChecked
    ? props.schedule.addFilterValues(facet, values)
    : props.schedule.removeFilterValues(facet, values);

const clearFacet = (facet: FilterFacet) =>
  props.schedule.removeFilterValues(facet, filters.value[facet]);

/**
 * A row stays in view while it is checked, whatever the search says, so
 * the user can always see and undo what is narrowing the grid.
 */
const isInView = (facet: FilterFacet, value: string, text: string) => {
  const query = search.value.trim().toLowerCase();
  return (
    query === "" ||
    isChecked(facet, value) ||
    text.toLowerCase().includes(query)
  );
};

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

const courseCount = computed(() =>
  courseLevels.value.reduce((sum, level) => sum + level.courses.length, 0),
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
