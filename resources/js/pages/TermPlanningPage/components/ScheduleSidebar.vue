<template>
  <aside
    aria-label="Filters"
    class="tw-flex tw-flex-col tw-rounded-md tw-border tw-border-solid tw-border-neutral-200 tw-bg-white"
  >
    <!-- Outside the scroll box below, so it is in reach however far the lists go. -->
    <div class="tw-flex-none tw-p-3">
      <label class="tw-sr-only" for="schedule-filter-search">
        Search courses, people, sections
      </label>
      <input
        id="schedule-filter-search"
        v-model="search"
        type="search"
        placeholder="Search courses, people, sections"
        class="tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-neutral-300 tw-px-3 tw-py-2 tw-text-sm placeholder:tw-text-neutral-400"
      />
    </div>

    <div class="tw-min-h-0 tw-flex-1 tw-overflow-y-auto">
      <FilterGroup
        v-if="courseLevels.length > 0"
        title="Courses"
        :count="courseCount"
        :checkedCount="filters.course.length"
        isOpenAtFirst
        @clear="clearFacet('course')"
      >
        <template v-for="level in courseLevels" :key="level.label">
          <!-- Pinned just under the group header, whose height is h-8. -->
          <div
            class="tw-sticky tw-top-8 tw-z-10 tw-flex tw-items-center tw-border-0 tw-border-b tw-border-solid tw-border-neutral-100 tw-bg-neutral-50"
          >
            <button
              type="button"
              class="tw-flex tw-h-full tw-w-7 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-self-stretch tw-border-none tw-bg-transparent tw-text-[0.6rem] tw-text-neutral-500"
              :aria-label="`${isLevelOpen(level.label) ? 'Collapse' : 'Expand'} ${level.label}`"
              :aria-expanded="isLevelOpen(level.label)"
              @click="toggleLevel(level.label)"
            >
              {{ isLevelOpen(level.label) ? "▼" : "▶" }}
            </button>
            <FilterRow
              class="tw-flex-1 tw-pl-0"
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
                class="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-neutral-700"
              >
                {{ level.label }}
              </span>
              <template #annotation>{{ level.courses.length }}</template>
            </FilterRow>
          </div>
          <FilterRows v-if="isLevelOpen(level.label)" :items="level.courses">
            <template #default="{ item }">
              <FilterRow
                :isChecked="isChecked('course', item.value)"
                @toggle="toggle('course', [item.value], $event)"
              >
                <span class="tw-block tw-font-mono tw-font-semibold">
                  {{ item.code }}
                </span>
                <span
                  class="tw-block tw-truncate tw-text-xs tw-text-neutral-600"
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
        isOpenAtFirst
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
                class="tw-block tw-truncate tw-text-xs tw-text-neutral-500"
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
              <span class="tw-font-mono">{{ item.label }}</span>
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
              <span class="tw-font-mono">{{ item.value }}</span>
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
 * text and which levels are folded, both of which only decide what is in
 * view.
 */
const props = defineProps<{
  options: FilterOptions;
  schedule: ScheduleEditor;
}>();

const search = ref("");

const filters = computed(() => props.schedule.state.value.filters);

const isChecked = (facet: FilterFacet, value: string) =>
  filters.value[facet].includes(value);

const toggle = (facet: FilterFacet, values: string[], isNowChecked: boolean) =>
  props.schedule.dispatch({
    type: isNowChecked ? "filterValuesAdded" : "filterValuesRemoved",
    facet,
    values,
  });

const clearFacet = (facet: FilterFacet) =>
  props.schedule.dispatch({
    type: "filterValuesRemoved",
    facet,
    values: filters.value[facet],
  });

/** Levels start open; only the ones a user has folded are remembered. */
const foldedLevels = ref<string[]>([]);

const isLevelOpen = (label: string) => !foldedLevels.value.includes(label);

const toggleLevel = (label: string) => {
  foldedLevels.value = isLevelOpen(label)
    ? [...foldedLevels.value, label]
    : foldedLevels.value.filter((folded) => folded !== label);
};

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
