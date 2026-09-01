<template>
  <nav aria-label="Breadcrumb">
    <ol class="tw-m-0 tw-flex tw-list-none tw-items-center tw-gap-2 tw-p-0">
      <li
        v-for="(crumb, index) in crumbs"
        :key="index"
        class="tw-flex tw-items-center tw-gap-2"
      >
        <span v-if="index > 0" class="tw-text-neutral-400" aria-hidden="true">
          ›
        </span>
        <router-link
          v-if="crumb.to"
          :to="crumb.to"
          class="tw-text-neutral-600 tw-no-underline hover:tw-text-neutral-900 hover:tw-underline"
        >
          {{ crumb.label }}
        </router-link>
        <span v-else class="tw-text-neutral-900" aria-current="page">
          {{ crumb.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

export interface Crumb {
  label: string;
  /** Absent on the current page, which is named but not linked. */
  to?: RouteLocationRaw;
}

defineProps<{
  crumbs: Crumb[];
}>();
</script>
