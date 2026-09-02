<template>
  <!--
    Every column header must be exactly this tall or the columns misalign.
    z-30 keeps it above blocks, which lift to z-20 while carried.
  -->
  <div
    class="tw-sticky tw-top-0 tw-z-30 tw-flex tw-h-8 tw-items-center tw-justify-center tw-border-0 tw-border-b tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-on-surface-variant"
  >
    <slot />
  </div>
</template>
