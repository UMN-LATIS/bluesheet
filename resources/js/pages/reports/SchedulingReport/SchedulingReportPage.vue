<template>
  <div
    class="tw-max-w-[90em] tw-w-full tw-mx-auto tw-bg-white tw-border tw-border-umn-neutral-200 tw-my-12 tw-p-8"
  >
    <h1 class="tw-mb-4">
      {{ group?.group_title }} <br />
      <span class="tw-text-3xl">Scheduling Report</span>
    </h1>
    <section class="tw-flex tw-flex-col tw-gap-4 tw-mb-4">
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
            <Button variant="tertiary" @click="toggleAllICourseLevels"
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

    <div class="tw-relative">
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
              class="tw-whitespace-nowrap"
              :class="{
                '!tw-bg-amber-100': term.id === currentTerm?.id,
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
          :nullValuePlaceholder="NULL_VALUE_PLACEHOLDER"
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
const NULL_VALUE_PLACEHOLDER = "Unspecified";

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

const searchInputRaw = ref("");
const debouncedSearch = debounce(() => {
  filters.search = searchInputRaw.value;
}, 500);
watch(searchInputRaw, debouncedSearch);

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

  return sortedInstructors;
});

function isIncludedInstructorAppointment(instructor: Instructor) {
  return !excludedInstAppointments.value.has(
    instructor.jobCategory ?? NULL_VALUE_PLACEHOLDER,
  );
}

function getAllCourseLevelsMap() {
  const allCourses: Course[] = [...coursesByTermMap.value.values()].flat();
  const courseLevels = new Map<string, number>();
  allCourses.forEach((course) => {
    const currentCount =
      courseLevels.get(course.academicCareer ?? NULL_VALUE_PLACEHOLDER) ?? 0;
    courseLevels.set(
      course.academicCareer ?? NULL_VALUE_PLACEHOLDER,
      currentCount + 1,
    );
  });
  return courseLevels;
}

function getAllCourseTypesMap() {
  const allCourses: Course[] = [...coursesByTermMap.value.values()].flat();
  const courseTypes = new Map<string, number>();
  allCourses.forEach((course) => {
    const currentCount =
      courseTypes.get(course.componentType ?? NULL_VALUE_PLACEHOLDER) ?? 0;
    courseTypes.set(
      course.componentType ?? NULL_VALUE_PLACEHOLDER,
      currentCount + 1,
    );
  });
  return courseTypes;
}

function getAllInstructorCategoriesMap() {
  const allInstructors = [...getInstructorsMap().values()];
  const instructorCategories = new Map<string, number>();
  allInstructors.forEach((instructor) => {
    const jobCategory =
      instructor.jobCategory?.trim() || NULL_VALUE_PLACEHOLDER;
    const currentCount = instructorCategories.get(jobCategory) ?? 0;
    instructorCategories.set(jobCategory, currentCount + 1);
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
    !excludedCourseTypes.value.has(
      course.componentType ?? NULL_VALUE_PLACEHOLDER,
    ) &&
    !excludedCourseLevels.value.has(
      course.academicCareer ?? NULL_VALUE_PLACEHOLDER,
    )
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

function toggleAllICourseLevels() {
  // if all are selected, deselect all
  if (excludedCourseLevels.value.size === courseLevelsMap.value.size) {
    excludedCourseLevels.value.clear();
    return;
  }

  // otherwise select all
  excludedCourseLevels.value = new Set(courseLevelsMap.value.keys());
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
