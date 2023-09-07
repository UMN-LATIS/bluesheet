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
          class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide"
        >
          Terms
        </legend>
        <div class="tw-flex tw-gap-2">
          <SelectGroup
            v-model="filters.startTermId"
            label="Start Term"
            :showLabel="false"
            :options="
              allTermsSortedByDate.map((term) => ({
                text: term.name,
                value: String(term.id),
              }))
            "
          />
          <SelectGroup
            v-model="filters.endTermId"
            label="End Term"
            :showLabel="false"
            :options="
              allTermsSortedByDate.map((term) => ({
                text: term.name,
                value: String(term.id),
              }))
            "
          />
          <Button
            variant="primary"
            @click="runReport"
            class="tw-whitespace-nowrap"
          >
            Run Report
          </Button>
        </div>
      </fieldset>

      <fieldset>
        <legend
          class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide"
        >
          Course Types
        </legend>
        <CheckboxGroup
          v-model="filters.showGradCourses"
          label="Grad Courses"
          id="hide-ind-courses"
        />
        <CheckboxGroup
          v-model="filters.showUndergradCourses"
          label="Undergrad Courses"
          id="hide-ind-courses"
        />
        <CheckboxGroup
          v-model="filters.showINDCourses"
          label="IND Courses"
          id="hide-ind-courses"
        />
      </fieldset>

      <fieldset>
        <legend
          class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide"
        >
          Appointment Type
        </legend>
        faculty, teaching specialist, etc. This will be filtering on jobcode by
        employee, which I definitely need to add to the API
      </fieldset>
    </section>

    <InputGroup
      :modelValue="filters.search"
      @update:modelValue="debouncedSearch"
      placeholder="Search"
      label="Search"
      type="search"
      :showLabel="false"
    />

    <div class="tw-relative">
      <div
        class="tw-absolute tw-inset-0 tw-m-auto tw-z-10 tw-flex tw-justify-center tw-bg-white/50 tw-gap-4"
        v-if="isTableLoading"
      >
        <Spinner class="tw-text-neutral-900 tw-w-6 tw-h-6" />
        Building Report...
      </div>

      <Table
        class="scheduling-report"
        :sticky-first-column="true"
        :sticky-header="true"
        v-if="
          instructorsMap.size > 0 && sortedTermsBetweenStartAndEndFilters.length
        "
      >
        <template #thead>
          <tr>
            <Th class="instructor-column">Instructor</Th>
            <Th
              v-for="term in sortedTermsBetweenStartAndEndFilters"
              :id="term.id"
              class="tw-whitespace-nowrap"
            >
              {{ term.name }}
              <Spinner
                class="tw-text-neutral-300 tw-h-4 tw-w-4"
                v-if="!coursesByTermMap.has(term.id)"
              />
            </Th>
          </tr>
        </template>
        <tr
          v-for="instructor in filteredInstructorsSortedByName"
          :key="instructor.id"
        >
          <Td class="instructor-column">
            <RouterLink
              :to="`/user/${instructor.id}`"
              :class="{
                'tw-bg-yellow-100 tw-text-blue-600 ':
                  filters.search.length &&
                  doesInstructorNameMatchSearchTerm(instructor, filters.search),
              }"
              >{{ instructor.surName }}, {{ instructor.givenName }}
            </RouterLink>
          </Td>
          <Td v-for="term in sortedTermsBetweenStartAndEndFilters">
            <div class="leaves tw-flex tw-flex-col tw-gap-1 tw-mb-2">
              <LeaveChip
                v-for="leave in selectInstructorTermLeaves(instructor, term)"
                :key="leave.id"
                :leave="leave"
              >
                {{ leave.description }} ({{ leave.type }})
              </LeaveChip>
            </div>
            <div
              v-for="course in selectInstructorTermCourses(instructor, term)"
            >
              <div
                class="tw-my-1 tw-px-1"
                :class="{
                  'tw-opacity-50 tw-line-through': course.cancelled,
                  'tw-bg-yellow-100':
                    filters.search.length &&
                    doesCourseMatchSearchTerm(course, filters.search),
                }"
              >
                {{ course.subject }} {{ course.catalogNumber }}
                <span class="tw-text-xs tw-text-neutral-400">
                  {{ course.enrollmentTotal }}/{{ course.enrollmentCap }}
                </span>
              </div>
            </div>
          </Td>
        </tr>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from "vue";
import * as api from "@/api";
import { Course, Term, Group, Instructor, Leave, ISODate } from "@/types";
import debounce from "lodash-es/debounce";
import dayjs from "dayjs";
import { Table, Td, Th } from "@/components/Table";
import LeaveChip from "@/components/LeaveChip.vue";
import Spinner from "@/components/Spinner.vue";
import InputGroup from "@/components/InputGroup.vue";
import CheckboxGroup from "@/components/CheckboxGroup.vue";
import SelectGroup from "@/components/SelectGroup.vue";
import pMap from "p-map";
import Button from "@/components/Button.vue";

const props = defineProps<{
  groupId: number;
}>();

type InstructorId = number;
type TermId = number;

const group = ref<Group>();
const termsMap = ref<Map<TermId, Term>>(new Map());
const coursesByTermMap = ref<Map<TermId, Course[]>>(new Map());

const filters = reactive({
  showINDCourses: true,
  showGradCourses: true,
  showUndergradCourses: true,
  startTermId: "",
  endTermId: "",
  search: "",
});

const startTerm = computed((): Term | null => {
  const termIdInt = Number(filters.startTermId);
  if (Number.isNaN(termIdInt)) {
    return null;
  }
  return termsMap.value.get(termIdInt) ?? null;
});
const endTerm = computed((): Term | null => {
  const termIdInt = Number(filters.endTermId);
  if (Number.isNaN(termIdInt)) {
    return null;
  }
  return termsMap.value.get(termIdInt) ?? null;
});

const sortedTermsBetweenStartAndEndFilters = computed(() => {
  if (!startTerm.value || !endTerm.value) {
    return [];
  }
  const termsInRange = selectTermsWithinRangeInclusive(
    startTerm.value.startDate,
    endTerm.value.endDate,
    [...termsMap.value.values()],
  );

  return termsInRange.sort((a, b) => {
    return dayjs(a.startDate).isBefore(dayjs(b.startDate)) ? -1 : 1;
  });
});

const instructorsMap = computed((): Map<InstructorId, Instructor> => {
  const allInstructors = new Map<InstructorId, Instructor>();
  coursesByTermMap.value.forEach((courses: Course[]) => {
    courses.forEach((course) => {
      allInstructors.set(course.instructor.id, course.instructor);
    });
  });
  return allInstructors;
});

const instructorsTeachingTermsWithinRange = computed(() => {
  const allInstructors = Array.from(instructorsMap.value.values());

  return allInstructors.filter((instructor) => {
    return sortedTermsBetweenStartAndEndFilters.value.some((term) => {
      const courses = selectInstructorTermCourses(instructor, term);
      return courses.length > 0;
    });
  });
});

function sortByName(
  a: { surName: string; givenName: string },
  b: { surName: string; givenName: string },
) {
  return (
    a.surName.localeCompare(b.surName) || a.givenName.localeCompare(b.givenName)
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

function hasInstructorTaughtCourseMatchingSearchTerm(
  instructor: Instructor,
  searchTerm: string,
) {
  return sortedTermsBetweenStartAndEndFilters.value.some((term) => {
    const courses = selectInstructorTermCourses(instructor, term);
    return courses.some((course) =>
      doesCourseMatchSearchTerm(course, searchTerm),
    );
  });
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

const filteredInstructorsSortedByName = computed(() => {
  return instructorsTeachingTermsWithinRange.value
    .filter((instructor) => {
      return (
        doesInstructorNameMatchSearchTerm(instructor, filters.search) ||
        hasInstructorTaughtCourseMatchingSearchTerm(instructor, filters.search)
      );
    })
    .sort(sortByName);
});

const isTableLoading = computed(() => {
  return sortedTermsBetweenStartAndEndFilters.value.some((term) => {
    return !coursesByTermMap.value.has(term.id);
  });
});

function sortCoursesByCourseNumber(a: Course, b: Course) {
  return (
    a.subject.localeCompare(b.subject) ||
    String(a.catalogNumber).localeCompare(String(b.catalogNumber)) ||
    a.classSection.localeCompare(b.classSection)
  );
}

function selectInstructorTermCourses(
  instructor: Instructor,
  term: Term,
): Course[] {
  const allDeptCoursesInTerm = coursesByTermMap.value.get(term.id);
  const courses =
    allDeptCoursesInTerm
      ?.filter((course) => {
        return course.instructor.id === instructor.id;
      })
      .filter((course) => {
        return filters.showINDCourses || course.componentType !== "IND";
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

const allTermsSortedByDate = computed((): Term[] => {
  return [...termsMap.value.values()].sort((a, b) => {
    return dayjs(a.startDate).isBefore(dayjs(b.startDate)) ? -1 : 1;
  });
});

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

const DEFAULT_START_DATE = dayjs().subtract(1.5, "year").format("YYYY-MM-DD");
const DEFAULT_END_DATE = dayjs().add(1.5, "year").format("YYYY-MM-DD");
const MAX_TERM_DATE = dayjs().add(3, "year").format("YYYY-MM-DD");

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

async function runReport() {
  const termsToGet = sortedTermsBetweenStartAndEndFilters.value;

  const loadCourseDataForTerm = async (term: Term) => {
    const courses = await api.getGroupCoursesByTerm({
      termId: term.id,
      groupId: props.groupId,
    });

    coursesByTermMap.value.set(term.id, courses);
  };

  pMap(termsToGet, loadCourseDataForTerm, { concurrency: 5 });
}

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
