<template>
  <div
    :class="{
      'tw-rounded-2xl tw-bg-neutral-100 tw-p-2 tw-pr-4 tw-mb-2': isOpen,
      'tw-rounded-full  tw-p-1': !isOpen,
    }"
  >
    <div class="tw-flex tw-items-center">
      <button
        class="tw-border-none tw-bg-transparent tw-text-neutral-500 tw-rounded-full tw-p-1 tw-flex tw-items-center tw-justify-center"
        @click="isOpen = !isOpen"
      >
        <span class="tw-sr-only">Show More</span>
        <ChevronDownIcon
          :class="{
            'tw-transform -tw-rotate-90': !isOpen,
          }"
        />
      </button>
      <RouterLink :to="`/user/${instructor.id}`">
        {{ instructor.surName }}, {{ instructor.givenName }}
      </RouterLink>
    </div>

    <div
      v-show="isOpen"
      class="tw-text-xs tw-text-neutral-400 tw-flex tw-flex-col tw-pl-6 tw-gap-1"
    >
      <span>
        {{ instructor.title }}
        {{ instructor.jobCode ? `(${instructor.jobCode})` : "" }}
      </span>
      <span>{{ instructor.emplid }}</span>
      <span v-if="instructor.sslApplyEligible">✦ SSL Apply Eligible </span>
      <span v-if="instructor.sslEligible">✦ SSL Eligible</span>
      <span v-if="instructor.midcareerEligible">✦ Midcareer Eligible</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import { Instructor } from "@/types";

defineProps<{
  instructor: Instructor;
}>();

const isOpen = ref(false);
</script>
<style scoped></style>
