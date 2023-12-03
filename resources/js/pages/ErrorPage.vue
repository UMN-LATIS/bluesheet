<template>
  <DefaultLayout>
    <div class="tw-p-8">
      <h1 class="tw-text-8xl tw-font-bold tw-text-neutral-200">
        {{ errorCode }}
      </h1>
      <h2 class="tw-text-4xl tw-mb-4">{{ getMessage(errorCode) }}</h2>
      <p class="tw-my-4">{{ getDetailedMessage(errorCode) }}</p>
      <Button href="/" icon="home" iconPosition="start"> Go Home </Button>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import Button from "@/components/Button.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

withDefaults(
  defineProps<{
    errorCode: number;
  }>(),
  {
    errorCode: 404,
  },
);

const statusMessages = {
  400: {
    message: "Bad Request",
    detailedMessage: "We couldn't understand your request.",
  },
  404: {
    message: "Page not found",
    detailedMessage: "We couldn't find this page.",
  },
  500: {
    message: "Internal Server Error",
    detailedMessage: "Something went wrong on our end.",
  },
};

function getMessage(code: number) {
  return statusMessages[code]?.message || "Unknown Error";
}

function getDetailedMessage(code: number) {
  return statusMessages[code]?.detailedMessage || "Something went wrong.";
}
</script>
<style scoped></style>
