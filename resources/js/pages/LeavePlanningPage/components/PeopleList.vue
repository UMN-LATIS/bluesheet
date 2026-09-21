<template>
  <div v-if="people.length > 0" class="tw-flex tw-flex-col tw-gap-2">
    <div
      v-for="person in people"
      :key="`${person.emplid}-${person.role}`"
      class="tw-flex tw-items-center tw-gap-2.5"
    >
      <span
        class="tw-flex tw-h-7 tw-w-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-surface-container tw-text-[10px] tw-font-bold tw-text-on-surface-variant"
      >
        {{ initialsOf(person.name) }}
      </span>
      <div class="tw-min-w-0 tw-flex-1">
        <p class="tw-m-0 tw-truncate tw-text-[13.5px]">{{ person.name }}</p>
        <p class="tw-m-0 tw-text-[11px] tw-text-on-surface-variant">
          {{ person.role }}
        </p>
      </div>
    </div>
  </div>
  <p v-else class="tw-m-0 tw-text-[13px] tw-text-on-surface-variant">
    {{ emptyLabel }}
  </p>
</template>

<script setup lang="ts">
export interface ListedPerson {
  emplid: number;
  name: string;
  role: string;
}

defineProps<{ people: ListedPerson[]; emptyLabel: string }>();

const initialsOf = (name: string) =>
  name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
</script>
