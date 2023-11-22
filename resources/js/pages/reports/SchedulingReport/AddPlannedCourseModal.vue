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
          v-model="selectedOptions.instructor"
          label="Instructor"
          :showLabel="true"
          :options="instructorOptions"
          :required="true"
        />
      </div>
      <div class="tw-mt-4 tw-flex tw-items-center tw-justify-end tw-gap-2">
        <Button variant="tertiary" @click="handleCancel"> Cancel </Button>
        <Button variant="primary">Save</Button>
      </div>
    </form>
  </Modal>
</template>
<script setup lang="ts">
import Modal from "@/components/Modal.vue";
import ComboBox, { ComboBoxOption } from "@/components/ComboBox2.vue";
import { Instructor, Term, TimelessCourse } from "@/types";
import { computed, onMounted, reactive } from "vue";
import Button from "@/components/Button.vue";

const props = defineProps<{
  terms: Term[];
  courses: TimelessCourse[];
  instructors: Instructor[];
  show: boolean;
  initialInstructor?: Instructor;
  initialTerm?: Term;
  initialCourse?: TimelessCourse;
}>();

const emits = defineEmits<{
  (eventName: "close");
}>();

const toTermOption = (t: Term) => ({
  id: t.id,
  label: t.name,
});

const toInstructorOption = (i: Instructor) => ({
  id: i.id,
  label: `${i.surName}, ${i.givenName}`,
  secondaryLabel: i.email,
});

const toTimelessCourseOption = (c: TimelessCourse) => ({
  id: c.shortCode,
  label: c.shortCode,
  secondaryLabel: c.title,
});

const initialSelected = computed(() => ({
  instructor: props.initialInstructor
    ? toInstructorOption(props.initialInstructor)
    : null,
  course: props.initialCourse
    ? toTimelessCourseOption(props.initialCourse)
    : null,
  term: props.initialTerm ? toTermOption(props.initialTerm) : null,
}));

const selectedOptions = reactive<{
  instructor: ComboBoxOption | null;
  course: ComboBoxOption | null;
  term: ComboBoxOption | null;
}>({
  instructor: initialSelected.value.instructor,
  course: initialSelected.value.course,
  term: initialSelected.value.term,
});

onMounted(() => {
  console.log("mounted", {
    initialSelected,
    selectedOptions,
    props,
  });
});

const termOptions = computed(() => props.terms.map(toTermOption));

const courseOptions = computed(() => props.courses.map(toTimelessCourseOption));

const instructorOptions = computed(() =>
  props.instructors.map(toInstructorOption),
);

const selectedCourse = computed(() => {
  return (
    props.courses.find((c) => c.shortCode === selectedOptions.course?.id) ??
    null
  );
});

const selectedTerm = computed(() => {
  return props.terms.find((t) => t.id === selectedOptions.term?.id) ?? null;
});

const selectedInstructor = computed(() => {
  return (
    props.instructors.find((i) => i.id === selectedOptions.instructor?.id) ??
    null
  );
});

function resetForm() {
  selectedOptions.course = initialSelected.value.course;
  selectedOptions.term = initialSelected.value.term;
  selectedOptions.instructor = initialSelected.value.instructor;
}

function handleCancel() {
  resetForm();
  emits("close");
}

function handleAddTentativeCourse() {
  console.log("add tentative course", {
    course: selectedCourse.value,
    term: selectedTerm.value,
    instructor: selectedInstructor.value,
  });
  emits("close");
}
</script>
<style scoped></style>
