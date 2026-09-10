<template>
  <Modal :title="`Import into ${termName}`" :show="show" @close="close">
    <div class="tw-flex tw-flex-col tw-gap-3">
      <div class="tw-flex tw-items-center tw-gap-2.5">
        <label
          class="tw-m-0 tw-flex-none tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
          :for="fieldId('from')"
        >
          From
        </label>
        <select
          :id="fieldId('from')"
          v-model.number="sourceTermId"
          class="tw-min-h-11 tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-py-1.5 tw-pl-3.5 tw-pr-8 tw-text-[13px] tw-font-semibold tw-text-on-surface"
        >
          <option v-for="term in sourceTerms" :key="term.id" :value="term.id">
            {{ term.name }}
          </option>
        </select>
      </div>

      <input
        v-model="search"
        type="search"
        placeholder="Search courses, people, sections"
        aria-label="Search courses, people, sections"
        class="tw-w-full tw-min-h-11 tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface tw-px-4 tw-text-[13px] tw-text-on-surface placeholder:tw-text-on-surface-variant focus:tw-border-primary focus:tw-bg-surface-bright focus:tw-outline-none"
      />

      <div class="tw-grid tw-grid-cols-4 tw-gap-2">
        <FacetTile
          v-for="tile in tiles"
          :key="tile.facet"
          :label="tile.label"
          :count="tile.count"
          :total="tile.total"
          :isActive="activeFacet === tile.facet"
          @click="activeFacet = tile.facet"
        />
      </div>

      <div
        class="tw-rounded-[10px] tw-border tw-border-solid tw-border-surface-container"
      >
        <div class="tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-p-1">
          <FilterRow
            isGroupHeading
            :isChecked="isEverythingSelected"
            :isIndeterminate="isSomethingSelected && !isEverythingSelected"
            @toggle="selectEverything"
          >
            Select all
            <template #annotation>
              {{ selectedIds.size }} of {{ sourceSections.length }}
            </template>
          </FilterRow>
        </div>

        <ul
          class="tw-m-0 tw-max-h-[42vh] tw-min-h-[42vh] tw-list-none tw-overflow-y-auto tw-p-1"
        >
          <template v-if="activeFacet === 'course'">
            <li v-for="level in courseLevels" :key="level.label">
              <FilterRow
                isGroupHeading
                :isChecked="isValueSelected('course', levelValues(level))"
                :isIndeterminate="isValuePartlySelected('course', levelValues(level))"
                @toggle="select('course', levelValues(level), $event)"
              >
                {{ level.label }}
                <template #annotation>{{ level.courses.length }}</template>
              </FilterRow>
              <FilterRow
                v-for="course in level.courses"
                :key="course.value"
                :isChecked="isValueSelected('course', [course.value])"
                :isIndeterminate="isValuePartlySelected('course', [course.value])"
                @toggle="select('course', [course.value], $event)"
              >
                {{ course.code }}
                <template #secondary>{{ course.title }}</template>
                <template #annotation>{{ course.sectionCount }} sec</template>
              </FilterRow>
            </li>
          </template>

          <li
            v-for="person in people"
            v-else-if="activeFacet === 'person'"
            :key="person.value"
          >
            <FilterRow
              :isChecked="isValueSelected('person', [person.value])"
              :isIndeterminate="isValuePartlySelected('person', [person.value])"
              @toggle="select('person', [person.value], $event)"
            >
              {{ person.listName }}
              <template #annotation>{{ person.sectionCount }}</template>
            </FilterRow>
          </li>

          <li
            v-for="option in sections"
            v-else-if="activeFacet === 'section'"
            :key="option.value"
          >
            <FilterRow
              :isChecked="isValueSelected('section', [option.value])"
              :swatch="colorOfType(option.component).dot"
              @toggle="select('section', [option.value], $event)"
            >
              {{ option.label }}
              <template #secondary>
                {{ option.days
                }}<template v-if="option.instructorLastName">
                  · {{ option.instructorLastName }}</template
                >
              </template>
            </FilterRow>
          </li>

          <li v-for="option in components" v-else :key="option.value">
            <FilterRow
              :isChecked="isValueSelected('component', [option.value])"
              :isIndeterminate="isValuePartlySelected('component', [option.value])"
              :swatch="colorOfType(option.value).dot"
              @toggle="select('component', [option.value], $event)"
            >
              {{ labelOfComponent(option.value) }}
              <template #annotation>{{ option.sectionCount }}</template>
            </FilterRow>
          </li>

          <li
            v-if="isListEmpty"
            class="tw-px-2 tw-py-6 tw-text-center tw-text-[11.5px] tw-text-on-surface-variant"
          >
            {{
              sourceSections.length === 0
                ? "Nothing to import from that term."
                : "Nothing here matches the search."
            }}
          </li>
        </ul>
      </div>

      <p v-if="error" class="tw-m-0 tw-text-[12.5px] tw-text-red-700">
        {{ error }}
      </p>
    </div>

    <template #footer>
      <span class="tw-me-auto tw-text-[12.5px] tw-text-on-surface-variant">
        {{ selectionSummary }}
      </span>
      <button
        type="button"
        class="tw-min-h-11 tw-rounded-full tw-border-none tw-bg-primary tw-px-6 tw-text-[13px] tw-font-bold tw-text-on-primary disabled:tw-cursor-default disabled:tw-bg-surface-container-high disabled:tw-text-on-surface-variant"
        :class="{ 'tw-cursor-pointer': canImport }"
        :disabled="!canImport"
        @click="submit"
      >
        Import {{ selectedIds.size }}
        {{ selectedIds.size === 1 ? "section" : "sections" }}
      </button>
      <button
        type="button"
        class="tw-ms-3 tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-semibold tw-text-on-surface-variant hover:tw-underline"
        @click="close"
      >
        Cancel
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import Modal from "@/components/Modal.vue";
import FacetTile from "./FacetTile.vue";
import FilterRow from "./FilterRow.vue";
import { colorOfType, labelOfComponent } from "../constants/meetingTypeColors";
import { buildFilterOptions, type CourseLevel } from "../helpers/filterOptions";
import {
  sectionIdsUnder,
  sectionsByFacetValue,
  selectionStateOf,
  valuesWithAnySelection,
  withSectionsSelected,
} from "../helpers/sectionSelection";
import { refusalMessage } from "../helpers/refusalMessage";
import { useSectionImport } from "../queries/useSectionImport";
import { useSisSectionsQuery } from "../queries/useSisSectionsQuery";
import { useSisGroupTermsQuery } from "../queries/useSisGroupTermsQuery";
import { FILTER_FACETS } from "../types";
import type { FilterFacet, SisSection } from "../types";

const props = defineProps<{
  show: boolean;
  groupId: number;
  termCode: number | null;
  termName: string;
  isTermEmpty: boolean;
  suggestedSourceTermId: number | null;
}>();

const emit = defineEmits<{ close: []; imported: [SisSection[]] }>();

const modalId = useId();
const fieldId = (field: string) => `${modalId}-${field}`;

const sourceTermId = ref<number | null>(null);
const selectedIds = ref(new Set<number>());
const search = ref("");
const activeFacet = ref<FilterFacet>("course");
const error = ref("");

const termsQuery = useSisGroupTermsQuery(computed(() => props.groupId));

const sourceTerms = computed(() =>
  (termsQuery.data.value ?? []).filter((term) => term.id !== props.termCode),
);

const sourceTermName = computed(
  () =>
    sourceTerms.value.find((term) => term.id === sourceTermId.value)?.name ?? "",
);

const sourceQuery = useSisSectionsQuery(
  computed(() => props.groupId),
  sourceTermId,
);

const sourceSections = computed(() => sourceQuery.data.value ?? []);

const options = computed(() => buildFilterOptions(sourceSections.value));

const byFacetValue = computed(() => sectionsByFacetValue(sourceSections.value));

const stateOf = (facet: FilterFacet, values: string[]) =>
  selectionStateOf(byFacetValue.value, selectedIds.value, facet, values);

const isValueSelected = (facet: FilterFacet, values: string[]) =>
  stateOf(facet, values) === "all";

const isValuePartlySelected = (facet: FilterFacet, values: string[]) =>
  stateOf(facet, values) === "some";

function select(facet: FilterFacet, values: string[], isNowSelected: boolean) {
  selectedIds.value = withSectionsSelected(
    selectedIds.value,
    sectionIdsUnder(byFacetValue.value, facet, values),
    isNowSelected,
  );
}

const selectEverything = (isNowSelected: boolean) => {
  selectedIds.value = isNowSelected
    ? new Set(sourceSections.value.map((section) => section.id))
    : new Set();
};

const isEverythingSelected = computed(
  () =>
    sourceSections.value.length > 0 &&
    selectedIds.value.size === sourceSections.value.length,
);

const isSomethingSelected = computed(() => selectedIds.value.size > 0);

const matchesEveryWord = (...fields: string[]) => {
  const haystack = fields.join(" ").toLowerCase();

  return search.value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};

const courseLevels = computed(() =>
  options.value.courseLevels
    .map((level) => ({
      ...level,
      courses: level.courses.filter((course) =>
        matchesEveryWord(course.code, course.title),
      ),
    }))
    .filter((level) => level.courses.length > 0),
);

const levelValues = (level: CourseLevel) =>
  level.courses.map((course) => course.value);

const people = computed(() =>
  [...options.value.faculty, ...(options.value.tba ? [options.value.tba] : [])]
    .filter((person) => matchesEveryWord(person.listName)),
);

const sections = computed(() =>
  options.value.sections.filter((option) =>
    matchesEveryWord(option.label, option.instructorLastName ?? ""),
  ),
);

const components = computed(() =>
  options.value.components.filter((option) =>
    matchesEveryWord(option.value, labelOfComponent(option.value)),
  ),
);

const isListEmpty = computed(
  () =>
    ({
      course: courseLevels.value.length,
      person: people.value.length,
      section: sections.value.length,
      component: components.value.length,
    })[activeFacet.value] === 0,
);

const FACET_LABELS: Record<FilterFacet, string> = {
  course: "Courses",
  person: "Faculty",
  section: "Sections",
  component: "Types",
};

const tiles = computed(() =>
  FILTER_FACETS.map((facet) => ({
    facet,
    label: FACET_LABELS[facet],
    ...valuesWithAnySelection(byFacetValue.value, selectedIds.value, facet),
  })),
);

const { importSections } = useSectionImport(
  computed(() => props.groupId),
  computed(() => props.termCode),
);

const selectionSummary = computed(() => {
  const courses = new Set(
    sourceSections.value
      .filter((section) => selectedIds.value.has(section.id))
      .map((section) => section.courseCode),
  );
  const coursePhrase =
    courses.size === 1 ? "1 course" : `${courses.size} courses`;

  return `from ${coursePhrase} in ${sourceTermName.value}`;
});

const canImport = computed(
  () => selectedIds.value.size > 0 && !importSections.isPending.value,
);

const everySourceSection = () =>
  new Set(sourceSections.value.map((section) => section.id));

function seedSelection() {
  selectedIds.value = props.isTermEmpty ? everySourceSection() : new Set();
}

watch(sourceSections, seedSelection);

watch(sourceTermId, () => {
  search.value = "";
});

watch(
  () => props.show,
  (isOpen) => {
    if (!isOpen) return;

    sourceTermId.value =
      props.suggestedSourceTermId ?? sourceTerms.value[0]?.id ?? null;
    seedSelection();
    search.value = "";
    activeFacet.value = "course";
    error.value = "";
  },
  { immediate: true },
);

function close() {
  emit("close");
}

async function submit() {
  error.value = "";

  try {
    const created = await importSections.mutateAsync({
      sourceTermId: sourceTermId.value!,
      sectionIds: [...selectedIds.value],
    });

    emit("imported", created);
  } catch (refusal) {
    error.value =
      refusalMessage(refusal) ?? "Those sections could not be imported.";
  }
}
</script>
