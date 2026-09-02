<template>
  <!--
    Every column's header must be exactly this tall, or the columns beneath
    them start at different heights and the whole grid loses its alignment.
    That shared constraint is why the header is a component rather than a
    repeated class list.

    Sticky against the page's scroll box, so the day names stay put while
    the hours scroll under them. z-30 puts it over the blocks, which lift to
    z-20 while carried.
  -->
  <div
    class="tw-sticky tw-top-0 tw-z-30 tw-flex tw-h-8 tw-items-center tw-justify-center tw-border-0 tw-border-b tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-on-surface-variant"
  >
    <slot />
  </div>
</template>
