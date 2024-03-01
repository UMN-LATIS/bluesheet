<template>
  <div>
    <Transition name="fade">
      <div
        v-if="error"
        class="tw-fixed tw-inset-0 tw-z-40 tw-bg-black/70 tw-flex tw-items-center tw-justify-center"
      >
        <Notification
          :title="errorTitle"
          type="danger"
          :isDismissable="true"
          class="tw-w-full tw-max-w-md tw-border-none max-h-[80vh] !overflow-auto"
          @dismiss="errorStore.clearError()"
        >
          <p>{{ message }}</p>

          <div class="tw-mt-1">
            <!-- using href for force app reload -->
            <Button href="/" variant="tertiary"> Go Home </Button>
          </div>
        </Notification>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button.vue";
import { useErrorStore } from "@/stores/useErrorStore";
import Notification from "@/components/Notification.vue";
import { ApiError } from "@/api";

const errorStore = useErrorStore();

const error = computed(() => errorStore.error);
const errorTitle = computed(() => {
  if (!(error.value instanceof ApiError)) {
    return "Error";
  }

  if (error.value.statusCode === 0) {
    return "Connection Error";
  }

  return `Error: ${error.value.statusCode}`;
});

const messages: Record<number | string, string> = {
  0: "There was a problem connecting to the server. If the problem persists, please contact support.",
  401: "You do not have permission to access this.",
  403: "You do not have permission to access this.",
  404: "We couldn't find this. Please check your link and try again.",

  // 4xx errors
  400: "There was a problem with your request. Please check your input and try again.",

  // 5xx errors
  500: "There was a problem on our end. Please contact support if the problem persists.",
};

const message = computed(() => {
  if (typeof error.value === "string") {
    return error.value;
  }

  if (!(error.value instanceof ApiError)) {
    return error.value?.message || "An unknown error occurred.";
  }

  const status = error.value.statusCode;
  if (status in messages) {
    return messages[status];
  }

  if (status >= 400 && status < 500) {
    return messages[400];
  }

  if (status >= 500 && status < 600) {
    return messages[500];
  }

  return error.value.message;
});
</script>
<style scoped></style>
