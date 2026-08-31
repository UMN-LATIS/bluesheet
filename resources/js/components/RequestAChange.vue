<template>
  <Modal
    :show="true"
    title="Request a Change"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit">
      <div class="tw-flex tw-flex-col tw-gap-4">
        <p class="tw-text-sm tw-text-neutral-600">
          Please describe the changes you would like to request for this group. Your request will be sent to the group managers.
        </p>
        
        <div class="form-group">
          <label for="changeRequest" class="tw-block tw-text-sm tw-font-medium tw-text-neutral-700 tw-mb-2">
            Change Request <span class="tw-text-red-600">*</span>
          </label>
          <textarea
            id="changeRequest"
            v-model="changeText"
            rows="6"
            class="form-control tw-w-full tw-px-3 tw-py-2 tw-border tw-border-neutral-300 tw-rounded-md tw-text-sm placeholder:tw-text-neutral-400 placeholder:tw-italic focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
            :class="{
              'tw-border-red-500': showError && !changeText.trim(),
            }"
            placeholder="Please describe the changes you would like to see..."
            required
          ></textarea>
          <div
            v-if="showError && !changeText.trim()"
            class="tw-text-red-600 tw-text-xs tw-mt-1"
          >
            Please describe the change you would like to request.
          </div>
        </div>

        <div
          v-if="submitError"
          class="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-md tw-p-3"
        >
          <p class="tw-text-red-800 tw-text-sm tw-m-0">
            {{ submitError }}
          </p>
        </div>
      </div>

      <div class="tw-flex tw-justify-end tw-gap-2 tw-mt-6">
        <Button
          variant="tertiary"
          type="button"
          @click="$emit('close')"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          :disabled="isSubmitting || !changeText.trim()"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from './Modal.vue';
import Button from './Button.vue';
import { axios } from '@/utils';
import * as T from '@/types';

const props = defineProps<{
  groupId: T.Group['id'];
}>();

const emit = defineEmits<{
  (eventName: 'close'): void;
}>();

const changeText = ref('');
const isSubmitting = ref(false);
const submitError = ref<string | null>(null);
const showError = ref(false);

async function handleSubmit() {
  showError.value = true;
  
  if (!changeText.value.trim()) {
    return;
  }

  isSubmitting.value = true;
  submitError.value = null;

  try {
    await axios.post(`/api/groups/${props.groupId}/change-request`, {
      description: changeText.value.trim(),
    },
    {
        skipErrorNotifications: true,
    });

    // Success - close the modal
    emit('close');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit change request. Please try again.';
    submitError.value = errorMessage;
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.form-control:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
