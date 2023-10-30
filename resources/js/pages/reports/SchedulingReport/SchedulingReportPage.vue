<template>
  <WideLayout>
    <h1 class="tw-mb-4">
      {{ group?.group_title }} <br />
      <span class="tw-text-3xl">Scheduling Report</span>
    </h1>
    <section class="tw-flex tw-flex-col tw-gap-4 tw-mb-4">
      <h2 class="sr-only">Report Filters</h2>

      <div class="tw-flex tw-gap-4 tw-mb-4">
        <SelectGroup
          v-model="instructorRole"
          label="Instructor Role"
          :options="[
            { text: 'Primary Instructor', value: 'PI' },
            { text: 'Teaching Assistant', value: 'TA' },
          ]"
          @update:modelValue="onInstructorRoleChange"
        />

        <fieldset>
          <legend
            class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
          >
            Date Range
          </legend>
          <div class="tw-flex tw-gap-2">
            <SelectGroup
              v-model="filters.startTermId"
              label="Start Term"
              :showLabel="false"
              :options="allTermOptions"
              @update:modelValue="runReport"
            />
            <SelectGroup
              v-model="filters.endTermId"
              label="End Term"
              :showLabel="false"
              :options="allTermOptions"
              @update:modelValue="runReport"
            />
          </div>
        </fieldset>
      </div>
      <div class="tw-flex tw-gap-8 tw-mb-4 tw-flex-wrap">
        <fieldset v-show="instructorCategoriesMap.size">
          <div class="tw-flex tw-items-baseline tw-mb-1">
            <legend
              class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
            >
              Instructor Appointment
            </legend>
            <Button variant="tertiary" @click="toggleAllInstructorAppointments">
              Select All
            </Button>
          </div>
          <label
            v-for="[category, count] in sortedAppointmentTypeFilters"
            :key="category"
            class="tw-flex tw-items-center tw-text-sm gap-1"
          >
            <input
              type="checkbox"
              :checked="!excludedInstAppointments.has(category)"
              class="tw-form-checkbox tw-mr-2 tw-border tw-border-neutral-500 tw-rounded"
              @change="
                excludedInstAppointments.has(category)
                  ? excludedInstAppointments.delete(category)
                  : excludedInstAppointments.add(category)
              "
            />

            {{ category }}
            <span class="tw-text-neutral-400 tw-text-xs ml-1"
              >({{ count }})</span
            >
          </label>
        </fieldset>

        <fieldset v-show="courseTypesMap.size">
          <div class="tw-flex tw-items-baseline tw-mb-1">
            <legend
              class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
            >
              Course Types
            </legend>
            <Button variant="tertiary" @click="toggleAllCourseTypes"
              >Select All</Button
            >
          </div>
          <label
            v-for="[courseType, count] in sortedCourseTypes"
            :key="courseType"
            class="tw-flex tw-items-center tw-text-sm gap-1"
          >
            <input
              type="checkbox"
              :checked="!excludedCourseTypes.has(courseType)"
              class="tw-form-checkbox tw-mr-2 tw-border tw-border-neutral-500 tw-rounded"
              @change="
                excludedCourseTypes.has(courseType)
                  ? excludedCourseTypes.delete(courseType)
                  : excludedCourseTypes.add(courseType)
              "
            />

            {{ courseType }}
            <span class="tw-text-neutral-400 tw-text-xs ml-1"
              >({{ count }})</span
            >
          </label>
        </fieldset>
        <fieldset v-show="courseLevelsMap.size">
          <div class="tw-flex tw-items-baseline tw-mb-1">
            <legend
              class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
            >
              Course Levels
            </legend>
            <Button variant="tertiary" @click="toggleAllCourseLevels"
              >Select All</Button
            >
          </div>
          <label
            v-for="[courseLevel, count] in courseLevelsMap.entries()"
            :key="courseLevel"
            class="tw-flex tw-items-center tw-text-sm gap-1"
          >
            <input
              type="checkbox"
              :checked="!excludedCourseLevels.has(courseLevel)"
              class="tw-form-checkbox tw-mr-2 tw-border tw-border-neutral-500 tw-rounded"
              @change="
                excludedCourseLevels.has(courseLevel)
                  ? excludedCourseLevels.delete(courseLevel)
                  : excludedCourseLevels.add(courseLevel)
              "
            />

            {{ courseLevel }}
            <span class="tw-text-neutral-400 tw-text-xs ml-1"
              >({{ count }})</span
            >
          </label>
        </fieldset>
      </div>
    </section>

    <div class="tw-flex tw-justify-end">
      <label
        class="tw-border tw-border-umn-neutral-200 tw-max-w-xs tw-w-full tw-rounded-md !tw-block"
      >
        <span class="sr-only">Filter by instructor name or course number</span>
        <input
          v-model="searchInputRaw"
          placeholder="Search table"
          :showLabel="false"
          class="tw-w-full tw-border-none tw-rounded-none tw-px-4 tw-py-2 tw-bg-transparent tw-text-sm"
        />
      </label>
    </div>

    <div class="tw-relative tw-min-h-[8em]">
      <Transition name="fade">
        <div
          v-if="isRunningReport"
          class="tw-flex tw-justify-center tw-items-start tw-bg-white/5 tw-gap-4 tw-absolute tw-inset-0 tw-z-10 tw-backdrop-blur-sm tw-p-16"
        >
          <Spinner class="tw-text-neutral-900 tw-w-6 tw-h-6" />
          Building Report...
        </div>
      </Transition>
      <Table
        ref="tableRef"
        class="scheduling-report"
        :stickyFirstColumn="true"
        :stickyHeader="true"
      >
        <template #thead>
          <tr>
            <Th class="instructor-column">Instructor</Th>
            <Th
              v-for="term in termsForReport"
              :id="`term-${term.id}`"
              :key="term.id"
              class="tw-whitespace-nowrap term-header-column"
              :class="{
                '!tw-bg-amber-100 !tw-border-amber-300 term-header-column--is-current-term':
                  term.id === currentTerm?.id,
                'term-header-column--is-fall-term': isFallTerm(term),
              }"
            >
              {{ term.name }}
              <Spinner
                v-if="!coursesByTermMap.has(term.id)"
                class="tw-text-neutral-300 tw-h-4 tw-w-4"
              />
            </Th>
          </tr>
        </template>
        <ReportRow
          v-for="instructor in instructorsWithinReportedTerms"
          v-show="isShowingInstructor(instructor)"
          :key="instructor.id"
          :instructor="instructor"
          :search="filters.search"
          :terms="termsForReport"
          :listOfTermCourses="
            termsForReport.map((term) =>
              getInstructorTermCourses(instructor, term),
            )
          "
          :listOfTermLeaves="
            termsForReport.map((term) =>
              selectInstructorTermLeaves(instructor, term),
            )
          "
          :currentTerm="currentTerm"
          :isShowingCourse="isShowingCourse"
        />
      </Table>
    </div>
  </WideLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import * as api from "@/api";
import {
  ApiCourseInstructorRecord,
  Term,
  Instructor,
  Leave,
  ISODate,
  InstructorRole,
} from "@/types";
import debounce from "lodash-es/debounce";
import dayjs from "dayjs";
import { Table, Th } from "@/components/Table";
import Spinner from "@/components/Spinner.vue";
import SelectGroup from "@/components/SelectGroup.vue";
import pMap from "p-map";
import Button from "@/components/Button.vue";
import ReportRow from "./ReportRow.vue";
import WideLayout from "@/layouts/WideLayout.vue";
import { sortEntriesByKey } from "./sortEntriesByKey";
import { sortByName } from "./sortByName";
import { useTerms } from "@/composables/useTerms";
import { useGroup } from "@/composables/useGroup";

const props = defineProps<{
  groupId: number;
}>();

type InstructorId = number;
type TermId = number;

const DEFAULT_START_DATE = dayjs().subtract(3, "year").format("YYYY-MM-DD");
const DEFAULT_END_DATE = dayjs().add(2, "year").format("YYYY-MM-DD");

const tableRef = ref<HTMLElement>();
const group = useGroup(props.groupId);
const { termsLookup, terms } = useTerms();
const coursesByTermMap = ref<Map<TermId, ApiCourseInstructorRecord[]>>(
  new Map(),
);
const isRunningReport = ref(false);
const courseLevelsMap = ref<Map<string, number>>(new Map()); // "UGRD", "GRAD"
const courseTypesMap = ref<Map<string, number>>(new Map()); // "LEC"
const instructorCategoriesMap = ref<Map<string, number>>(new Map()); // "Faculty"
const instructorRole = ref<InstructorRole>("PI");

const filters = reactive({
  startTermId: "",
  endTermId: "",
  search: "",
});

const searchInputRaw = ref("");
const debouncedSearch = debounce(() => {
  filters.search = searchInputRaw.value;
}, 500);
watch(searchInputRaw, debouncedSearch);

const excludedCourseLevels = ref<Set<string>>(new Set());
const excludedCourseTypes = ref<Set<string>>(new Set(["IND", "FWK"]));
const excludedInstAppointments = ref<Set<string>>(new Set());

const allTermOptions = computed(() => {
  return terms.value.map((term) => ({
    text: term.name,
    value: String(term.id),
  }));
});

const currentTerm = computed((): Term | null => {
  const currentTerm = [...termsLookup.value.values()].find((term) => {
    const termStart = dayjs(term.startDate);
    const termEnd = dayjs(term.endDate);
    const today = dayjs();
    return today.isBetween(termStart, termEnd, "day", "[]");
  });

  return currentTerm ?? null;
});

const sortedAppointmentTypeFilters = computed(() => {
  return [...instructorCategoriesMap.value.entries()].sort(sortEntriesByKey);
});

const sortedCourseTypes = computed(() => {
  return [...courseTypesMap.value.entries()].sort(sortEntriesByKey);
});

// not making these computed to avoid reactivity lag
const termsForReport = ref<Term[]>([]);
const instructorsForReport = ref<Instructor[]>([]);

function isShowingInstructor(instructor: Instructor) {
  return (
    isIncludedInstructorAppointment(instructor) &&
    hasTaughtCourseMatchingFilters(instructor) &&
    (filters.search === "" ||
      doesInstructorNameMatchSearchTerm(instructor, filters.search) ||
      hasInstructorTaughtCourseMatchingSearchTerm(instructor, filters.search))
  );
}

function hasTaughtCourseMatchingFilters(instructor: Instructor) {
  const allTerms = [...termsLookup.value.values()];
  return allTerms.some((term) => {
    const courses = getInstructorTermCourses(instructor, term);
    return courses.some((course) => isShowingCourse(course));
  });
}

const instructorsWithinReportedTerms = computed(() => {
  const instructorsMap = getInstructorsMap();
  const reportTerms = getReportTerms();
  const allInstructors = [...instructorsMap.values()];

  const reportInstructors: Instructor[] = [];

  // loop through all instuctors and check if they have taught at least
  // once course in the filtered terms
  for (const instructor of allInstructors) {
    for (const term of reportTerms) {
      const coursesTaught = getInstructorTermCourses(instructor, term).length;
      if (coursesTaught) {
        reportInstructors.push(instructor);
        break;
      }
    }
  }

  const sortedInstructors = reportInstructors.sort(sortByName);

  return sortedInstructors;
});

function isIncludedInstructorAppointment(instructor: Instructor) {
  return !excludedInstAppointments.value.has(instructor.academicAppointment);
}

function getAllCourseLevelsMap() {
  const allCourses: ApiCourseInstructorRecord[] = [
    ...coursesByTermMap.value.values(),
  ].flat();
  const courseLevels = new Map<string, number>();
  allCourses.forEach((course) => {
    const currentCount = courseLevels.get(course.courseLevel) ?? 0;
    courseLevels.set(course.courseLevel, currentCount + 1);
  });
  return courseLevels;
}

function getAllCourseTypesMap() {
  const allCourses: ApiCourseInstructorRecord[] = [
    ...coursesByTermMap.value.values(),
  ].flat();
  const courseTypes = new Map<string, number>();
  allCourses.forEach((course) => {
    const currentCount = courseTypes.get(course.courseType) ?? 0;
    courseTypes.set(course.courseType, currentCount + 1);
  });
  return courseTypes;
}

function getAllInstructorCategoriesMap() {
  const allInstructors = [...getInstructorsMap().values()];
  const instructorCategories = new Map<string, number>();
  allInstructors.forEach((instructor) => {
    const currentCount =
      instructorCategories.get(instructor.academicAppointment) ?? 0;
    instructorCategories.set(instructor.academicAppointment, currentCount + 1);
  });
  return instructorCategories;
}

function hasInstructorTaughtCourseMatchingSearchTerm(
  instructor: Instructor,
  searchTerm: string,
) {
  const allTerms = [...termsLookup.value.values()];
  return allTerms.some((term) => {
    const courses = getInstructorTermCourses(instructor, term);
    return courses.some((course) =>
      doesCourseMatchSearchTerm(course, searchTerm),
    );
  });
}

function getInstructorsMap(): Map<InstructorId, Instructor> {
  const allInstructors = new Map<InstructorId, Instructor>();
  coursesByTermMap.value.forEach((courses: ApiCourseInstructorRecord[]) => {
    courses.forEach((course) => {
      allInstructors.set(course.instructor.id, course.instructor);
    });
  });
  return allInstructors;
}

function getReportTerms() {
  if (!filters.startTermId || !filters.endTermId) {
    return [];
  }
  const startTerm = termsLookup.value.get(Number(filters.startTermId));
  const endTerm = termsLookup.value.get(Number(filters.endTermId));
  const allTerms = [...termsLookup.value.values()];

  if (!startTerm || !endTerm || !allTerms.length) {
    return [];
  }

  return selectTermsWithinRangeInclusive(
    startTerm.startDate,
    endTerm.endDate,
    allTerms,
  ).sort(sortByTermDateAsc);
}

function getInstructorsTeachingWithinReportTerms() {
  const instructorsMap = getInstructorsMap();
  const reportTerms = getReportTerms();
  const allInstructors = [...instructorsMap.values()];

  const reportInstructors: Instructor[] = [];

  // loop through all instuctors and check if they have taught at least
  // once course in the filtered terms
  for (const instructor of allInstructors) {
    for (const term of reportTerms) {
      const coursesTaught = getInstructorTermCourses(instructor, term).length;
      if (coursesTaught) {
        reportInstructors.push(instructor);
        break;
      }
    }
  }

  const sortedInstructors = reportInstructors.sort(sortByName);
  return sortedInstructors;
}

function doesInstructorNameMatchSearchTerm(
  instructor: Instructor,
  searchTerm: string,
) {
  return (
    instructor.surName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.givenName.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

function doesCourseMatchSearchTerm(
  course: ApiCourseInstructorRecord,
  searchTerm: string,
) {
  const courseTitle =
    `${course.subject} ${course.catalogNumber} ${course.classSection}`.toLowerCase();

  return courseTitle.includes(searchTerm.toLowerCase());
}

function sortCoursesByCourseNumber(
  a: ApiCourseInstructorRecord,
  b: ApiCourseInstructorRecord,
) {
  return (
    a.subject.localeCompare(b.subject) ||
    String(a.catalogNumber).localeCompare(String(b.catalogNumber)) ||
    a.classSection.localeCompare(b.classSection)
  );
}

function isShowingCourse(course: ApiCourseInstructorRecord) {
  return (
    !excludedCourseTypes.value.has(course.courseType) &&
    !excludedCourseLevels.value.has(course.courseLevel)
  );
}

function getInstructorTermCourses(
  instructor: Instructor,
  term: Term,
): ApiCourseInstructorRecord[] {
  const allDeptCoursesInTerm = coursesByTermMap.value.get(term.id);
  const courses =
    allDeptCoursesInTerm?.filter((course) => {
      return course.instructor.id === instructor.id;
    }) ?? [];
  return [...courses].sort(sortCoursesByCourseNumber);
}

function selectInstructorTermLeaves(
  instructor: Instructor,
  term: Term,
): Leave[] {
  return (
    instructor.leaves?.filter((leave) => {
      const leaveStart = dayjs(leave.start_date);
      const leaveEnd = dayjs(leave.end_date);
      const termStart = dayjs(term.startDate);
      const termEnd = dayjs(term.endDate);

      return (
        termStart.isBetween(leaveStart, leaveEnd, "day", "[]") ||
        termEnd.isBetween(leaveStart, leaveEnd, "day", "[]")
      );
    }) ?? []
  );
}

function sortByTermDateAsc(a: Term, b: Term) {
  return dayjs(a.startDate).isBefore(dayjs(b.startDate)) ? -1 : 1;
}

function selectTermsWithinRangeInclusive(
  startDate: ISODate,
  endDate: ISODate,
  terms: Term[],
) {
  return terms.filter((term) => {
    const termStart = dayjs(term.startDate);
    const termEnd = dayjs(term.endDate);
    return (
      termStart.isSameOrAfter(startDate) && termEnd.isSameOrBefore(endDate)
    );
  });
}
function toggleAllCourseTypes() {
  const areAllSelected = excludedCourseTypes.value.size === 0;
  if (areAllSelected) {
    // deselect all (i.e. add all keys to the excluded set)
    excludedCourseTypes.value = new Set(courseTypesMap.value.keys());
    return;
  }

  // otherwise select all (i.e. clear the set)
  excludedCourseTypes.value.clear();
}

function toggleAllInstructorAppointments() {
  const areAllSelected = excludedInstAppointments.value.size === 0;
  if (areAllSelected) {
    // deselect all (i.e. add all keys to the excluded set)
    excludedInstAppointments.value = new Set(
      instructorCategoriesMap.value.keys(),
    );
    return;
  }

  // otherwise select all (i.e. clear the set)
  excludedInstAppointments.value.clear();
}

function toggleAllCourseLevels() {
  const areAllSelected = excludedCourseLevels.value.size === 0;
  if (areAllSelected) {
    // deselect all (i.e. add all keys to the excluded set)
    excludedCourseLevels.value = new Set(courseLevelsMap.value.keys());
    return;
  }

  // otherwise select all (i.e. clear the set)
  excludedCourseLevels.value.clear();
}

async function loadCourseDataForTerm(term: Term) {
  const courses = await api.getGroupCoursesByTerm({
    termId: term.id,
    groupId: props.groupId,
    roles: ["PI", "TA"],
  });

  coursesByTermMap.value.set(term.id, courses);
}

async function onInstructorRoleChange() {
  // clear existing instructor and course data
  instructorsForReport.value = [];
  coursesByTermMap.value.clear();

  // rerun the report
  await runReport();
}

async function runReport() {
  isRunningReport.value = true;
  termsForReport.value = getReportTerms();
  const termsNeedingData = termsForReport.value.filter(
    (term) => !coursesByTermMap.value.has(term.id),
  );

  await pMap(termsNeedingData, loadCourseDataForTerm, {
    concurrency: 5,
  });

  instructorsForReport.value = getInstructorsTeachingWithinReportTerms();

  // update course levels and types
  courseLevelsMap.value = getAllCourseLevelsMap();
  courseTypesMap.value = getAllCourseTypesMap();
  instructorCategoriesMap.value = getAllInstructorCategoriesMap();

  isRunningReport.value = false;

  scrollToCurrentTerm();
}

function scrollToCurrentTerm() {
  if (!currentTerm.value) return;
  const currentTermEl = document.getElementById(`term-${currentTerm.value.id}`);
  if (!currentTermEl) return;
  currentTermEl.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });
}

watch(tableRef, () => {
  scrollToCurrentTerm();
});

watch(
  [termsLookup, group],
  async () => {
    // if there aren't any terms loaded, don't do anything
    if (!termsLookup.value.size || !group.value) {
      return;
    }

    coursesByTermMap.value.clear();

    // set the default start and end terms
    const defaultTerms = selectTermsWithinRangeInclusive(
      DEFAULT_START_DATE,
      DEFAULT_END_DATE,
      [...termsLookup.value.values()],
    );
    filters.startTermId = String(defaultTerms[0].id);
    filters.endTermId = String(defaultTerms[defaultTerms.length - 1].id);

    runReport();
  },
  { immediate: true },
);

function isFallTerm(term: Term) {
  return term.name.includes("Fall");
}
</script>
<style scoped lang="scss">
.details-list {
  max-width: 480px;
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 0 1rem;
  align-items: baseline;
  margin-top: 1rem;
  margin-bottom: 1rem;

  & dt {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
  }
}
</style>
<style lang="scss">
.scheduling-report-page__post-it {
  max-width: 90em;
  padding: 1rem;
  width: 100%;
  margin: auto;
}
.scheduling-report-page__post-it .outer-container {
  max-width: 100% !important;
}

.term-header-column.term-header-column--is-fall-term {
  border-left: 2px solid #eee;
}
</style>
