<template>
  <div
    class="tw-flex tw-border-0 tw-border-b tw-border-solid tw-border-surface-container"
    :style="{
      width: 'calc(var(--lp-name) + var(--lp-track) + var(--lp-trailing))',
      minHeight: `${height}px`,
    }"
  >
    <div
      class="tw-sticky tw-left-0 tw-z-10 tw-flex tw-flex-none tw-flex-col tw-justify-center tw-gap-px tw-border-0 tw-border-r tw-border-solid tw-border-surface-container tw-bg-surface-bright tw-px-3.5 tw-py-2"
      :style="{ width: 'var(--lp-name)' }"
    >
      <component
        :is="nameLink ? RouterLink : 'span'"
        v-bind="nameLink ? { to: nameLink } : {}"
        class="tw-truncate tw-text-[13px] tw-font-semibold tw-text-on-surface"
      >
        {{ name }}
      </component>
      <span
        v-if="detail"
        class="tw-truncate tw-text-[11px] tw-text-on-surface-variant"
        :title="detail"
      >
        {{ detail }}
      </span>
    </div>
    <div
      class="tw-relative tw-flex-none"
      :class="{ 'tw-cursor-copy': isTrackClickable }"
      :style="{ width: 'var(--lp-track)' }"
      @click="clickTrack"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from "vue-router";

const props = withDefaults(
  defineProps<{
    name: string;
    nameLink?: RouteLocationRaw;
    detail: string | null;
    height: number;
    isTrackClickable?: boolean;
  }>(),
  { nameLink: undefined, isTrackClickable: false },
);

const emit = defineEmits<{ clickTrack: [fraction: number] }>();

function clickTrack(event: MouseEvent) {
  if (!props.isTrackClickable) return;

  // A bar is a button inside the track, so its click
  // bubbles here; without this, selecting a leave also
  // opens the create form on top of it.
  const track = event.currentTarget as HTMLElement;
  if (event.target !== track) return;

  emit("clickTrack", event.offsetX / track.clientWidth);
}
</script>
