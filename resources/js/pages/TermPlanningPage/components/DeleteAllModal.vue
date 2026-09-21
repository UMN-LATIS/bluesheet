<template>
  <Modal title="Delete all planned sections?" :show="show" @close="close">
    <div
      class="tw-flex tw-flex-col tw-gap-2 tw-rounded-[10px] tw-bg-brand-container tw-px-4 tw-py-3.5"
    >
      <p class="tw-m-0 tw-text-[13.5px] tw-font-bold tw-text-on-surface">
        All {{ everySectionId.length }}
        {{ everySectionId.length === 1 ? "section" : "sections" }} planned for
        {{ termName }} will be deleted.
      </p>
      <p class="tw-m-0 tw-text-[12.5px] tw-leading-normal tw-text-on-surface">
        Their meeting times and instructor assignments go with them, and this
        cannot be undone.
      </p>
    </div>

    <p v-if="error" class="tw-mb-0 tw-mt-3 tw-text-[12.5px] tw-text-red-700">
      {{ error }}
    </p>

    <template #footer>
      <button
        type="button"
        class="tw-min-h-11 tw-rounded-full tw-border-none tw-bg-brand tw-px-6 tw-text-[13px] tw-font-bold tw-text-white disabled:tw-cursor-default disabled:tw-bg-surface-container-high disabled:tw-text-on-surface-variant"
        :class="{ 'tw-cursor-pointer': canDelete }"
        :disabled="!canDelete"
        @click="submit"
      >
        {{ deleteSections.isPending.value ? "Deleting…" : deleteLabel }}
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
import { computed, ref, watch } from "vue";
import Modal from "@/components/Modal.vue";
import { refusalMessage } from "@/utils/refusalMessage";
import { useSectionBatch } from "../queries/useSectionBatch";

const props = defineProps<{
  show: boolean;
  groupId: number;
  termCode: number | null;
  termName: string;
  everySectionId: number[];
}>();

const emit = defineEmits<{ close: []; deleted: [] }>();

const error = ref("");

const { deleteSections } = useSectionBatch(
  computed(() => props.groupId),
  computed(() => props.termCode),
);

const canDelete = computed(
  () => props.everySectionId.length > 0 && !deleteSections.isPending.value,
);

const deleteLabel = computed(
  () =>
    `Delete ${props.everySectionId.length} ${
      props.everySectionId.length === 1 ? "section" : "sections"
    }`,
);

watch(
  () => props.show,
  () => {
    error.value = "";
  },
);

function close() {
  emit("close");
}

async function submit() {
  error.value = "";

  try {
    await deleteSections.mutateAsync(props.everySectionId);
    emit("deleted");
  } catch (refusal) {
    error.value =
      refusalMessage(refusal) ?? "Those sections could not be deleted.";
  }
}
</script>
