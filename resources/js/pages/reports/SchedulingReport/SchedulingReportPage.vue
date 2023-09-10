<template>
  <div>
    <h1 class="tw-mb-4">
      {{ group?.group_title }} <br />
      <span class="tw-text-3xl">Scheduling Report</span>
    </h1>
    <section class="tw-flex tw-flex-col tw-gap-4 tw-mb-4 tw-max-w-md">
      <h2 class="sr-only">Report Filters</h2>

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

      <fieldset v-show="courseLevelsMap.size">
        <legend
          class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
        >
          Course Levels
        </legend>
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
          <span class="tw-text-neutral-400 tw-text-xs ml-1">({{ count }})</span>
        </label>
      </fieldset>

      <fieldset v-show="instructorCategoriesMap.size">
        <legend
          class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
        >
          Instructor Appointment
          <Button variant="tertiary" @click="toggleAllInstructorAppointments"
            >Select All</Button
          >
        </legend>
        <label
          v-for="[category, count] in instructorCategoriesMap.entries()"
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
          <span class="tw-text-neutral-400 tw-text-xs ml-1">({{ count }})</span>
        </label>
      </fieldset>

      <fieldset v-show="courseTypesMap.size">
        <legend
          class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
        >
          Course Types
          <Button variant="tertiary" @click="toggleAllCourseTypes"
            >Select All</Button
          >
        </legend>
        <label
          v-for="[courseType, count] in courseTypesMap.entries()"
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
          <span class="tw-text-neutral-400 tw-text-xs ml-1">({{ count }})</span>
        </label>
      </fieldset>
    </section>

    <InputGroup
      :modelValue="filters.search"
      placeholder="Search"
      label="Filter by instructor name or course number"
      type="search"
      :showLabel="false"
      class="tw-mb-2"
      @update:modelValue="debouncedSearch"
    />

    <div class="tw-relative">
      <Transition name="fade" mode="out-in">
        <div
          v-if="isRunningReport"
          class="tw-flex tw-justify-center tw-items-center tw-bg-black/5 tw-gap-4 tw-h-[20vh]"
        >
          <Spinner class="tw-text-neutral-900 tw-w-6 tw-h-6" />
          Building Report...
        </div>
        <Table
          v-else
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
                class="tw-whitespace-nowrap"
                :class="{
                  '!tw-bg-umn-gold-light': term.id === currentTerm?.id,
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
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed, watch } from "vue";
import * as api from "@/api";
import { Course, Term, Group, Instructor, Leave, ISODate } from "@/types";
import debounce from "lodash-es/debounce";
import dayjs from "dayjs";
import { Table, Th } from "@/components/Table";
import Spinner from "@/components/Spinner.vue";
import InputGroup from "@/components/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup.vue";
import pMap from "p-map";
import Button from "@/components/Button.vue";
import ReportRow from "./ReportRow.vue";

const props = defineProps<{
  groupId: number;
}>();

type InstructorId = number;
type TermId = number;

const DEFAULT_START_DATE = dayjs().subtract(3, "year").format("YYYY-MM-DD");
const DEFAULT_END_DATE = dayjs().add(2, "year").format("YYYY-MM-DD");
const MAX_TERM_DATE = dayjs().add(3, "year").format("YYYY-MM-DD");

const tableRef = ref<HTMLElement>();
const group = ref<Group>();
const termsMap = ref<Map<TermId, Term>>(new Map());
const coursesByTermMap = ref<Map<TermId, Course[]>>(new Map());
const isRunningReport = ref(false);
const courseLevelsMap = ref<Map<string, number>>(new Map()); // "UGRD", "GRAD"
const courseTypesMap = ref<Map<string, number>>(new Map()); // "LEC"
const instructorCategoriesMap = ref<Map<string, number>>(new Map()); // "Faculty"

const filters = reactive({
  startTermId: "",
  endTermId: "",
  search: "",
});

const excludedCourseLevels = ref<Set<string>>(new Set());
const excludedCourseTypes = ref<Set<string>>(new Set());
const excludedInstAppointments = ref<Set<string>>(new Set());

const allTermOptions = computed(() => {
  return [...termsMap.value.values()].map((term) => ({
    text: term.name,
    value: String(term.id),
  }));
});

const currentTerm = computed((): Term | null => {
  const currentTerm = [...termsMap.value.values()].find((term) => {
    const termStart = dayjs(term.startDate);
    const termEnd = dayjs(term.endDate);
    const today = dayjs();
    return today.isBetween(termStart, termEnd, "day", "[]");
  });

  return currentTerm ?? null;
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
  const allTerms = [...termsMap.value.values()];
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
  console.timeEnd("getInstructorsTeachingWithinFilteredTerms");

  return sortedInstructors;
});

function isIncludedInstructorAppointment(instructor: Instructor) {
  return !excludedInstAppointments.value.has(
    instructor.jobCategory ?? "Unknown",
  );
}

function getAllCourseLevelsMap() {
  const allCourses: Course[] = [...coursesByTermMap.value.values()].flat();
  const courseLevels = new Map<string, number>();
  allCourses.forEach((course) => {
    const currentCount =
      courseLevels.get(course.academicCareer ?? "Unknown") ?? 0;
    courseLevels.set(course.academicCareer ?? "Unknown", currentCount + 1);
  });
  return courseLevels;
}

function getAllCourseTypesMap() {
  const allCourses: Course[] = [...coursesByTermMap.value.values()].flat();
  const courseTypes = new Map<string, number>();
  allCourses.forEach((course) => {
    const currentCount =
      courseTypes.get(course.componentType ?? "Unknown") ?? 0;
    courseTypes.set(course.componentType ?? "Unknown", currentCount + 1);
  });
  return courseTypes;
}

function getAllInstructorCategoriesMap() {
  const allInstructors = [...getInstructorsMap().values()];
  const instructorCategories = new Map<string, number>();
  allInstructors.forEach((instructor) => {
    const currentCount =
      instructorCategories.get(instructor.jobCategory ?? "Unknown") ?? 0;
    instructorCategories.set(
      instructor.jobCategory ?? "Unknown",
      currentCount + 1,
    );
  });
  return instructorCategories;
}

function hasInstructorTaughtCourseMatchingSearchTerm(
  instructor: Instructor,
  searchTerm: string,
) {
  const allTerms = [...termsMap.value.values()];
  return allTerms.some((term) => {
    const courses = getInstructorTermCourses(instructor, term);
    return courses.some((course) =>
      doesCourseMatchSearchTerm(course, searchTerm),
    );
  });
}

function getInstructorsMap(): Map<InstructorId, Instructor> {
  const allInstructors = new Map<InstructorId, Instructor>();
  coursesByTermMap.value.forEach((courses: Course[]) => {
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
  const startTerm = termsMap.value.get(Number(filters.startTermId));
  const endTerm = termsMap.value.get(Number(filters.endTermId));
  const allTerms = [...termsMap.value.values()];

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
  console.time("getInstructorsTeachingWithinFilteredTerms");
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
  console.timeEnd("getInstructorsTeachingWithinFilteredTerms");

  return sortedInstructors;
}

function sortByName(
  a: { surName: string; givenName: string },
  b: { surName: string; givenName: string },
) {
  return (
    a.surName.localeCompare(b.surName) || a.givenName.localeCompare(b.givenName)
  );
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

const debouncedSearch = debounce((value) => {
  filters.search = value;
}, 300);

function doesCourseMatchSearchTerm(course: Course, searchTerm: string) {
  const courseTitle =
    `${course.subject} ${course.catalogNumber} ${course.classSection}`.toLowerCase();

  return courseTitle.includes(searchTerm.toLowerCase());
}

function sortCoursesByCourseNumber(a: Course, b: Course) {
  return (
    a.subject.localeCompare(b.subject) ||
    String(a.catalogNumber).localeCompare(String(b.catalogNumber)) ||
    a.classSection.localeCompare(b.classSection)
  );
}

function isShowingCourse(course: Course) {
  return (
    !excludedCourseTypes.value.has(course.componentType ?? "Unknown") &&
    !excludedCourseLevels.value.has(course.academicCareer ?? "Unknown")
  );
}

function getInstructorTermCourses(
  instructor: Instructor,
  term: Term,
): Course[] {
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
  // if all are selected, deselect all
  if (excludedCourseTypes.value.size === courseTypesMap.value.size) {
    excludedCourseTypes.value.clear();
    return;
  }

  // otherwise select all
  excludedCourseTypes.value = new Set(courseTypesMap.value.keys());
}

function toggleAllInstructorAppointments() {
  // if all are selected, deselect all
  if (
    excludedInstAppointments.value.size === instructorCategoriesMap.value.size
  ) {
    excludedInstAppointments.value.clear();
    return;
  }

  // otherwise select all
  excludedInstAppointments.value = new Set(
    instructorCategoriesMap.value.keys(),
  );
}

async function loadTerms() {
  // reset the maps
  termsMap.value.clear();

  // get terms and group info
  const allTerms = await api.getTerms();

  // init the termsMap with all terms
  allTerms
    .filter((t) => {
      return dayjs(t.endDate).isSameOrBefore(MAX_TERM_DATE);
    })
    .forEach((term) => {
      termsMap.value.set(term.id, term);
    });
}

async function loadGroup() {
  group.value = await api.getGroup(props.groupId);
}

async function loadCourseDataForTerm(term: Term) {
  const courses = await api.getGroupCoursesByTerm({
    termId: term.id,
    groupId: props.groupId,
  });

  coursesByTermMap.value.set(term.id, courses);
}

async function runReport() {
  console.time("runReport");
  isRunningReport.value = true;
  const reportTerms = getReportTerms();
  const termsNeedingData = reportTerms.filter(
    (term) => !coursesByTermMap.value.has(term.id),
  );

  await pMap(termsNeedingData, loadCourseDataForTerm, {
    concurrency: 5,
  });

  termsForReport.value = reportTerms;
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

onMounted(async () => {
  // reset data
  coursesByTermMap.value.clear();
  termsMap.value.clear();
  group.value = undefined;

  // load data
  await Promise.all([loadGroup(), loadTerms()]);

  // set the default start and end terms
  const defaultTerms = selectTermsWithinRangeInclusive(
    DEFAULT_START_DATE,
    DEFAULT_END_DATE,
    [...termsMap.value.values()],
  );
  filters.startTermId = String(defaultTerms[0].id);
  filters.endTermId = String(defaultTerms[defaultTerms.length - 1].id);

  runReport();
});
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
