<template>
  <Modal
    :show="show"
    title="Add Tentative Course"
    :closeOnEsc="false"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleAddTentativeCourse">
      <div class="tw-flex tw-flex-col tw-gap-4">
        <ComboBox
          id="select-course-combobox"
          v-model="selectedOptions.course"
          :options="courseOptions"
          label="Course"
          :showLabel="true"
          :required="true"
        />
        <ComboBox
          id="select-term-combobox"
          v-model="selectedOptions.term"
          label="Term"
          :showLabel="true"
          :options="termOptions"
          :required="true"
        />
        <ComboBox
          id="select-instructor-combobox"
          v-model="selectedOptions.person"
          label="Instructor"
          :showLabel="true"
          :options="instructorOptions"
          :required="true"
        />
      </div>
      <div class="tw-mt-4 tw-flex tw-items-center tw-justify-end tw-gap-2">
        <Button variant="tertiary" @click="handleCancel"> Cancel </Button>
        <Button variant="primary" @click="handleAddTentativeCourse">
          Save
        </Button>
      </div>
    </form>
  </Modal>
</template>
<script setup lang="ts">
import Modal from "@/components/Modal.vue";
import ComboBox, { ComboBoxOption } from "@/components/ComboBox2.vue";
import { Term } from "@/types";
import { computed, reactive } from "vue";
import Button from "@/components/Button.vue";
import { useRootCoursePlanningStore } from "../stores/useRootCoursePlanningStore";
import * as T from "@/types";

const props = defineProps<{
  show: boolean;
  initialPerson?: T.Person;
  initialTerm?: Term;
  initialCourse?: T.Course;
}>();

const emits = defineEmits<{
  (eventName: "close");
}>();

const coursePlanningStore = useRootCoursePlanningStore();

const terms = computed(() => coursePlanningStore.scheduleableTerms);
const courses = computed(() => coursePlanningStore.courseStore.allCourses);
const people = computed(() => coursePlanningStore.personStore.allPeople);

const toTermOption = (t: Term) => ({
  id: t.id,
  label: t.name,
});

const toPersonOption = (i: T.Person) => ({
  id: i.id,
  label: `${i.surName}, ${i.givenName}`,
  secondaryLabel: i.email,
});

const toCourseOption = (c: T.Course) => ({
  id: c.id,
  label: c.id,
  secondaryLabel: c.title,
});

const initialSelected = computed(() => ({
  person: props.initialPerson ? toPersonOption(props.initialPerson) : null,
  course: props.initialCourse ? toCourseOption(props.initialCourse) : null,
  term: props.initialTerm ? toTermOption(props.initialTerm) : null,
}));

const selectedOptions = reactive<{
  person: ComboBoxOption | null;
  course: ComboBoxOption | null;
  term: ComboBoxOption | null;
}>({
  person: initialSelected.value.person,
  course: initialSelected.value.course,
  term: initialSelected.value.term,
});

const termOptions = computed(() => terms.value.map(toTermOption));

const courseOptions = computed(() => courses.value.map(toCourseOption));

const instructorOptions = computed(() => people.value.map(toPersonOption));

const selectedCourse = computed(() => {
  return courses.value.find((c) => c.id === selectedOptions.course?.id) ?? null;
});

const selectedTerm = computed(() => {
  return terms.value.find((t) => t.id === selectedOptions.term?.id) ?? null;
});

const selectedInstructor = computed(() => {
  return people.value.find((i) => i.id === selectedOptions.person?.id) ?? null;
});

function resetForm() {
  selectedOptions.course = initialSelected.value.course;
  selectedOptions.term = initialSelected.value.term;
  selectedOptions.person = initialSelected.value.person;
}

function handleCancel() {
  resetForm();
  emits("close");
}

function handleAddTentativeCourse() {
  if (
    !selectedTerm.value ||
    !selectedCourse.value ||
    !selectedInstructor.value
  ) {
    throw new Error("Missing required fields");
  }

  coursePlanningStore.createSectionWithEnrollee({
    course: selectedCourse.value,
    term: selectedTerm.value,
    person: selectedInstructor.value,
    role: "PI",
  });

  resetForm();
  emits("close");
}
</script>
<style scoped></style>
