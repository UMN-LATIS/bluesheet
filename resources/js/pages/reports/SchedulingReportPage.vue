<template>
  <div>
    <div v-if="group" class="tw-mt-8 tw-mb-16">
      <h2>{{ group.group_title }}</h2>
    </div>

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
        name="Scheduling Report"
        :sticky-first-column="true"
        :sticky-header="true"
        v-if="instructorsMap.size > 0 && termsMap.size > 0"
      >
        <template #thead>
          <tr>
            <Th class="instructor-column">Instructor</Th>
            <Th
              v-for="term in termsSortedByDate"
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
        <template #actions>
          <CheckboxGroup
            id="filter-courses-checkbox"
            v-model="filterINDCourses"
            label="Filter IND courses"
          />
          <InputGroup
            :modelValue="searchTerm"
            @update:modelValue="debouncedSearch"
            placeholder="Search"
            label="Search"
            class="tw-w-64"
            type="search"
            :showLabel="false"
          />
         
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
                  searchTerm.length &&
                  doesInstructorNameMatchSearchTerm(instructor, searchTerm),
              }"
              >{{ instructor.surName }}, {{ instructor.givenName }}
            </RouterLink>
          </Td>
          <Td v-for="term in termsSortedByDate">
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
                    searchTerm.length &&
                    doesCourseMatchSearchTerm(course, searchTerm),
                }"
              >
                {{ course.subject }} {{ course.catalogNumber }}
                {{ course.classSection }}
              </div>
            </div>
          </Td>
        </tr>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, computed } from "vue";
import * as api from "@/api";
import { Course, Term, Group, Instructor, Leave } from "@/types";
import debounce from "lodash-es/debounce";
import dayjs from "dayjs";
import { Table, Td, Th } from "@/components/Table";
import LeaveChip from "@/components/LeaveChip.vue";
import Spinner from "@/components/Spinner.vue";
import InputGroup from "@/components/InputGroup.vue";
import CheckboxGroup from "@/components/CheckboxGroup.vue";

const props = defineProps<{
  groupId: number;
}>();

// key: `term-id`
type InstructorId = number;
type TermId = number;

const group = ref<Group>();
const termsMap = ref<Map<TermId, Term>>(new Map());
const coursesByTermMap = ref<Map<TermId, Course[]>>(new Map());
const searchTerm = ref<string>("");
const filterINDCourses = ref<boolean>(true);
const instructorsMap = computed((): Map<InstructorId, Instructor> => {
  const allInstructors = new Map<InstructorId, Instructor>();
  coursesByTermMap.value.forEach((courses: Course[]) => {
    courses.forEach((course) => {
      allInstructors.set(course.instructor.id, course.instructor);
    });
  });
  return allInstructors;
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
  searchTerm.value = value;
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
  return termsSortedByDate.value.some((term) => {
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
  return Array.from(instructorsMap.value.values())
    .filter((instructor) => {
      return (
        doesInstructorNameMatchSearchTerm(instructor, searchTerm.value) ||
        hasInstructorTaughtCourseMatchingSearchTerm(
          instructor,
          searchTerm.value,
        )
      );
    })
    .sort(sortByName);
});

const isTableLoading = computed(() => {
  return Array.from(termsMap.value.values()).some((term) => {
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
    allDeptCoursesInTerm?.filter((course) => {
      return course.instructor.id === instructor.id;
    }).filter((course) => {
      return !filterINDCourses.value || course.compomentType !== "IND";
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

const termsSortedByDate = computed((): Term[] => {
  return [...termsMap.value.values()].sort((a, b) => {
    return dayjs(a.startDate).isBefore(dayjs(b.startDate)) ? -1 : 1;
  });
});

function selectTermsWithinRange(terms: Term[]) {
  const threeYearsAgo = dayjs().subtract(3, "year");
  const twoYearsFromNow = dayjs().add(2, "year");
  return terms.filter((term) => {
    const termStart = dayjs(term.startDate);
    const termEnd = dayjs(term.endDate);
    return (
      termStart.isAfter(threeYearsAgo) && termEnd.isBefore(twoYearsFromNow)
    );
  });
}

watch(
  () => props.groupId,
  async () => {
    // reset the maps
    coursesByTermMap.value.clear();

    const [allTerms, groupResponse] = await Promise.all([
      api.getTerms(),
      api.getGroup(props.groupId),
    ]);

    group.value = groupResponse;

    const termsWithinRange = selectTermsWithinRange(allTerms);

    // for each term, get the group courses and update the instructorTermCoursesMap
    termsWithinRange.forEach(async (term) => {
      termsMap.value.set(term.id, term);

      const courses = await api.getGroupCoursesByTerm({
        termId: term.id,
        groupId: props.groupId,
      });

      coursesByTermMap.value.set(term.id, courses);
    });
  },
  { immediate: true },
);
</script>
<style scoped lang="scss"></style>
