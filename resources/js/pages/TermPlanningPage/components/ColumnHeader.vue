<template>
  <!--
    Every column header must be exactly this tall or the columns misalign.
    z-30 keeps it above blocks, which lift to z-20 while carried.
  -->
  <div
    class="tw-sticky tw-top-0 tw-z-30 tw-flex tw-h-10 tw-items-center tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-bg-surface-bright tw-px-3.5 tw-text-xs tw-text-on-surface-variant"
  >
    <slot />
  </div>
</template>
