<template>
  <Modal title="New course" :show="show" @close="emit('close')">
    <form
      :id="formId"
      class="tw-flex tw-flex-col tw-gap-4"
      @submit.prevent="submit"
    >
      <div class="tw-flex tw-gap-3">
        <div class="tw-min-w-0 tw-flex-1">
          <FieldLabel :for="fieldId('subject')">Subject</FieldLabel>
          <input
            :id="fieldId('subject')"
            v-model="subject"
            type="text"
            required
            maxlength="255"
            placeholder="ANTH"
            class="field-control tw-w-full tw-uppercase"
          />
        </div>
        <div class="tw-min-w-0 tw-flex-1">
          <FieldLabel :for="fieldId('catalogNumber')">
            Catalog number
          </FieldLabel>
          <input
            :id="fieldId('catalogNumber')"
            v-model="catalogNumber"
            type="text"
            required
            maxlength="255"
            placeholder="5099"
            class="field-control tw-w-full tw-uppercase"
          />
        </div>
      </div>

      <div>
        <FieldLabel :for="fieldId('title')">Title</FieldLabel>
        <input
          :id="fieldId('title')"
          v-model="title"
          type="text"
          required
          maxlength="255"
          placeholder="Seminar in Memory"
          class="field-control tw-w-full"
        />
      </div>

      <div>
        <FieldLabel :for="fieldId('credits')">Credits</FieldLabel>
        <input
          :id="fieldId('credits')"
          v-model="credits"
          type="number"
          min="0"
          class="field-control tw-w-24"
        />
      </div>

      <p class="tw-m-0 tw-text-[12.5px] tw-text-on-surface-variant">
        The department can plan against this course straight away. It stays
        marked unofficial until the registrar publishes it.
      </p>

      <p v-if="error" class="tw-m-0 tw-text-[12.5px] tw-text-red-700">
        {{ error }}
      </p>
    </form>

    <template #footer>
      <button
        type="submit"
        :form="formId"
        class="tw-min-h-11 tw-rounded-full tw-border-none tw-bg-primary tw-px-6 tw-text-[13px] tw-font-bold tw-text-on-primary disabled:tw-cursor-default disabled:tw-bg-surface-container-high disabled:tw-text-on-surface-variant"
        :class="{ 'tw-cursor-pointer': !createCourse.isPending.value }"
        :disabled="createCourse.isPending.value"
      >
        Add course
      </button>
      <button
        type="button"
        class="tw-ms-3 tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-semibold tw-text-on-surface-variant hover:tw-underline"
        @click="emit('close')"
      >
        Cancel
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import Modal from "@/components/Modal.vue";
import FieldLabel from "./FieldLabel.vue";
import { useTermPlanMutations } from "../queries/useTermPlanMutations";
import type { PlannableCourse } from "../types";

const props = defineProps<{
  show: boolean;
  groupId: number;
  termCode: number | null;
}>();

const emit = defineEmits<{ close: []; created: [PlannableCourse] }>();

const formId = useId();
const fieldId = (field: string) => `${formId}-${field}`;

const subject = ref("");
const catalogNumber = ref("");
const title = ref("");
const credits = ref("");
const error = ref("");

const { createCourse } = useTermPlanMutations(
  computed(() => props.groupId),
  computed(() => props.termCode),
);

// a modal reopened after a refusal would otherwise still show the old message
watch(
  () => props.show,
  (isOpen) => {
    if (!isOpen) return;

    subject.value = "";
    catalogNumber.value = "";
    title.value = "";
    credits.value = "";
    error.value = "";
  },
);

async function submit() {
  error.value = "";

  try {
    const course = await createCourse.mutateAsync({
      subject: subject.value.trim().toUpperCase(),
      catalogNumber: catalogNumber.value.trim().toUpperCase(),
      title: title.value.trim(),
      credits: credits.value.trim() === "" ? null : Number(credits.value),
    });

    emit("created", course);
  } catch (refusal) {
    error.value =
      messageOf(refusal) ??
      "That course could not be added. Check the subject and catalog number.";
  }
}

/** Laravel sends a 422's per-field messages under `errors`. */
function messageOf(refusal: unknown): string | undefined {
  const errors = (
    refusal as { response?: { data?: { errors?: Record<string, string[]> } } }
  ).response?.data?.errors;

  return errors && Object.values(errors)[0]?.[0];
}
</script>

<style scoped>
/* Matches SectionSheet's controls; see the note on `.field-control` there. */
.field-control {
  min-height: 44px;
  border: 1px solid var(--outline-variant);
  border-radius: 10px;
  background-color: var(--surface-bright);
  padding-inline: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--on-surface);
}

.field-control:focus {
  border-color: var(--primary);
  outline: none;
}
</style>
