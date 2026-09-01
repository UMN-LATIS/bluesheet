<template>
  <div class="tw-overflow-hidden">
    <div class="tw-truncate tw-font-semibold">{{ heading }}</div>
    <div class="tw-truncate">{{ byline }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SisSection } from "../types";

/**
 * What one section's block says. Where it sits, and how it responds to the
 * pointer, stay `MeetingBlock`'s business.
 */
const props = defineProps<{
  section: SisSection;
  /** The lane width the day's packing left this block, in pixels. */
  width: number;
}>();

/**
 * Two lanes of a day's base width. At or above it — a day with little
 * overlap — a block can spell out its section number and component; below,
 * the catalog number and a last name are all that fit.
 */
const WIDE_LANE_WIDTH = 120;

const isWide = computed(() => props.width >= WIDE_LANE_WIDTH);

const heading = computed(() =>
  isWide.value
    ? `${props.section.catalogNumber} · ${props.section.section}`
    : props.section.catalogNumber,
);

/** The principal instructor: the one a scheduler scans the grid for. */
const leadInstructor = computed(
  () =>
    props.section.instructors.find(({ role }) => role === "PI") ??
    props.section.instructors[0],
);

const byline = computed(() => {
  const instructor = leadInstructor.value;
  const name = instructor?.lastName ?? instructor?.name ?? "TBA";

  return isWide.value ? `${props.section.component} ${name}` : name;
});
</script>
