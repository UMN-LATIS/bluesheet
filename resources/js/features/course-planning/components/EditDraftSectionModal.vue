<template>
  <Modal
    :show="show"
    :title="`${isEditingSection ? 'Edit' : 'Add'} Class`"
    :closeOnEsc="false"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit">
      <div class="tw-flex tw-flex-col tw-gap-4">
        <ComboBox
          v-if="!isAddingAsNewCourse"
          id="select-course-combobox"
          v-model="selectedOptions.course"
          :options="courseOptions"
          label="Course"
          :showLabel="true"
          :required="true"
          :canAddNewOption="true"
          @addNewOption="isAddingAsNewCourse = true"
        />
        <fieldset
          v-if="isAddingAsNewCourse"
          class="tw-border-neutral-300 tw-bg-neutral-100 tw-flex tw-flex-col tw-gap-4 tw-p-4 tw-rounded-md"
        >
          <div
            class="tw-flex tw-justify-between tw-items-center tw-border-0 tw-border-b tw-border-neutral-200 tw-border-solid"
          >
            <legend class="tw-text-base tw-font-bold tw-m-0">
              Add New Course Option ✨
            </legend>
          </div>
          <div class="tw-flex tw-gap-4">
            <InputGroup
              id="new-course-subject"
              class="tw-w-1/2"
              label="Subject"
              :required="true"
              placeholder="ANTH, HIST, etc."
              :modelValue="newCourse.subject"
              @update:modelValue="
                (str: string) => (newCourse.subject = str.toUpperCase())
              "
            />
            <InputGroup
              id="new-course-catalog-number"
              class="tw-w-1/2"
              label="Catalog Number"
              :required="true"
              placeholder="1001, 2002W, etc."
              :modelValue="newCourse.catalogNumber"
              @update:modelValue="
                (str: string) => (newCourse.catalogNumber = str.toUpperCase())
              "
            />
          </div>
          <InputGroup
            id="new-course-title"
            v-model="newCourse.title"
            label="Title"
            :required="true"
            placeholder="Europe and the World, etc."
          />

          <div class="tw-flex tw-justify-end tw-items-center">
            <Button variant="tertiary" @click="handleCancelAddNewCourseOption"
              >Cancel</Button
            >
            <Button
              variant="secondary"
              :disabled="!isFormValidForAddingNewCourseOption"
              @click="handleSaveNewCourseOption"
              >Add Option</Button
            >
          </div>
        </fieldset>

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
          :label="selectedOptions.role?.label || 'Instructor'"
          :showLabel="true"
          :options="instructorOptions"
          :required="true"
        />
        <ComboBox
          id="select-role-combobox"
          v-model="selectedOptions.role"
          label="Role"
          :showLabel="true"
          :options="roleOptions"
          :required="true"
        />
      </div>
      <div class="tw-mt-4 tw-flex tw-items-center tw-justify-end tw-gap-2">
        <Button variant="tertiary" @click="handleCancel"> Cancel </Button>
        <Button
          variant="primary"
          type="submit"
          :disabled="!isFormValid || !hasFormChanged"
        >
          Save
        </Button>
      </div>
    </form>
  </Modal>
</template>
<script setup lang="ts">
import Modal from "@/components/Modal.vue";
import ComboBox, { ComboBoxOption } from "@/components/ComboBox.vue";
import { Term } from "@/types";
import { computed, reactive, ref, watch } from "vue";
import Button from "@/components/Button.vue";
import { useCoursePlanningStore } from "../stores/useCoursePlanningStore";
import * as T from "@/types";
import InputGroup from "@/components/InputGroup.vue";

const props = defineProps<{
  show: boolean;
  initialPerson?: T.Person | null;
  initialTerm?: Term | null;
  initialCourse?: T.Course | null;
  initialRole?: T.EnrollmentRole | null;
}>();

const emits = defineEmits<{
  (eventName: "close");
  (
    eventName: "save",
    selectedOptions: {
      person: T.Person;
      course: T.Course;
      term: T.Term;
      role: T.EnrollmentRole;
    },
  );
}>();

const coursePlanningStore = useCoursePlanningStore();
const isEditingSection = computed(() => !!props.initialCourse);

const terms = computed(() =>
  coursePlanningStore.termsStore.terms.filter((t) =>
    coursePlanningStore.termsStore.isTermPlannable(t.id),
  ),
);
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
  label: c.source === "local" ? `${c.id} (Draft)` : c.id,
  secondaryLabel: c.title,
});

const toRoleOption = (r: T.EnrollmentRole) => {
  const roleLabels = {
    PI: "Instructor",
    TA: "Teaching Assistant",
  };
  return {
    id: r,
    label: roleLabels[r],
  };
};

const initialSelected = computed(() => ({
  person: props.initialPerson ? toPersonOption(props.initialPerson) : null,
  course: props.initialCourse ? toCourseOption(props.initialCourse) : null,
  term: props.initialTerm ? toTermOption(props.initialTerm) : null,
  role: props.initialRole ? toRoleOption(props.initialRole) : null,
}));

const selectedOptions = reactive<{
  person: ComboBoxOption | null;
  course: ComboBoxOption | null;
  term: ComboBoxOption | null;
  role: ComboBoxOption | null;
}>({
  person: null,
  course: null,
  term: null,
  role: null,
});

// if the initial values change, the section was likely moved
// so we need to update the selected options
watch(
  [
    () => props.initialCourse,
    () => props.initialPerson,
    () => props.initialTerm,
    () => props.initialRole,
  ],
  () => {
    Object.keys(selectedOptions).forEach((key) => {
      selectedOptions[key] = initialSelected.value[key];
    });
  },
  {
    immediate: true,
  },
);

const termOptions = computed(() => terms.value.map(toTermOption));

const courseOptions = computed(() => courses.value.map(toCourseOption));

const instructorOptions = computed(() => people.value.map(toPersonOption));
const roleOptions = [
  { id: "PI", label: "Instructor" },
  { id: "TA", label: "Teaching Assistant" },
];

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
  selectedOptions.role = initialSelected.value.role;
}

function handleCancel() {
  resetForm();
  emits("close");
}

const hasFormChanged = computed(() => {
  return (
    selectedInstructor.value?.id !== props.initialPerson?.id ||
    selectedCourse.value?.id !== props.initialCourse?.id ||
    selectedTerm.value?.id !== props.initialTerm?.id ||
    selectedOptions.role?.id !== props.initialRole
  );
});

const isFormValid = computed(() => {
  return Object.values(selectedOptions).every((value) => !!value);
});

function handleSubmit() {
  if (
    !selectedInstructor.value ||
    !selectedCourse.value ||
    !selectedTerm.value
  ) {
    throw new Error("Missing required fields");
  }

  emits("save", {
    person: selectedInstructor.value,
    course: selectedCourse.value,
    term: selectedTerm.value,
    role: selectedOptions.role?.id as T.EnrollmentRole,
  });

  resetForm();
  emits("close");
}

const isAddingAsNewCourse = ref(false);
const newCourse = reactive<Omit<T.Course, "id" | "courseCode">>({
  subject: "",
  catalogNumber: "",
  title: "",
  courseType: "TBD",
  courseLevel: "TBD",
  source: "local",
});
const isFormValidForAddingNewCourseOption = computed(() => {
  return !!newCourse.subject && !!newCourse.catalogNumber && !!newCourse.title;
});

function handleCancelAddNewCourseOption() {
  isAddingAsNewCourse.value = false;
  newCourse.subject = "";
  newCourse.catalogNumber = "";
  newCourse.title = "";
}

function handleSaveNewCourseOption() {
  if (!newCourse.subject || !newCourse.catalogNumber || !newCourse.title) {
    throw new Error("Missing required fields");
  }

  const newCourseShortCode: T.CourseShortCode = `${newCourse.subject}-${newCourse.catalogNumber}`;

  const newCourseOption: T.Course = {
    id: newCourseShortCode,
    courseCode: newCourseShortCode,
    ...newCourse,
  };

  coursePlanningStore.courseStore.addCourse(newCourseOption);
  selectedOptions.course = toCourseOption(newCourseOption);
  isAddingAsNewCourse.value = false;
  newCourse.subject = "";
  newCourse.catalogNumber = "";
  newCourse.title = "";
}
</script>
<style scoped></style>
