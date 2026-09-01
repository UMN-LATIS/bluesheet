<template>
  <!--
    Every column's header must be exactly this tall, or the columns beneath
    them start at different heights and the whole grid loses its alignment.
    That shared constraint is why the header is a component rather than a
    repeated class list.
  -->
  <div
    class="tw-flex tw-h-8 tw-items-center tw-justify-center tw-border-0 tw-border-b tw-border-solid tw-border-neutral-200 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-neutral-500"
  >
    <slot />
  </div>
</template>
