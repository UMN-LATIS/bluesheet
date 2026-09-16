<template>
  <section
    aria-labelledby="term-leave-strip-heading"
    class="tw-flex tw-max-h-16 tw-flex-wrap cramped:tw-max-h-36 tw-items-center tw-gap-x-2.5 tw-gap-y-1.5 tw-overflow-y-auto tw-px-3.5 tw-py-2"
  >
    <h2
      id="term-leave-strip-heading"
      class="tw-m-0 tw-flex-none tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
    >
      On leave
    </h2>

    <ul
      class="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2.5 tw-gap-y-1.5 tw-p-0"
    >
      <li v-for="leave in leaves" :key="leave.id" class="tw-list-none">
        <!--
          Dropping "group" loses the hover underline: the chip is an
          inline-flex box, so it never inherits this link's own
          text-decoration, and reaches for group-hover instead.
        -->
        <router-link
          :to="{ name: 'user', params: { userId: leave.userId } }"
          class="group tw-inline-flex tw-no-underline hover:tw-no-underline"
        >
          <TermLeaveChip :leave="leave" />
        </router-link>
      </li>
    </ul>
    <router-link
      v-if="termCode !== null"
      :to="{
        name: 'leavePlanning',
        params: { groupId },
        query: { start: termCode },
      }"
      class="tw-ml-auto tw-flex tw-min-h-8 tw-flex-none tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-3 tw-text-xs tw-font-semibold tw-text-primary tw-no-underline hover:tw-bg-surface hover:tw-no-underline"
    >
      View Leaves
      <ArrowRightIcon class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
    </router-link>
  </section>
</template>

<script setup lang="ts">
import { ArrowRightIcon } from "@/icons";
import TermLeaveChip from "./TermLeaveChip.vue";
import type { TermLeave } from "@/types";

defineProps<{
  leaves: TermLeave[];
  groupId: number;
  termCode: number | null;
}>();
</script>
