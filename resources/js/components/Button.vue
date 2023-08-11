<template>
  <component
    :is="componentType"
    class="tw-inline-flex tw-items-center tw-gap-1 tw-no-underline hover:tw-no-underline tw-rounded tw-justify-center tw-leading-none tw-transition-colors tw-ease-in-out tw-group tw-cursor-pointer"
    :class="{
      'tw-border tw-border-blue-600 tw-bg-blue-600 hover:tw-border-700 hover:tw-bg-blue-700 tw-text-blue-50 tw-px-4 tw-py-3':
        variant === 'primary',
      'tw-border tw-border-blue-600 tw-text-blue-600 px-4 py-3':
        variant === 'secondary',
      'tw-text-blue-600 hover:tw-bg-blue-100 tw-text-xs tw-uppercase tw-font-semibold tw-p-2 tw-bg-transparent tw-border-none':
        variant === 'tertiary',
    }"
    v-bind="$attrs"
    :to="componentType === RouterLink ? to : undefined"
    :href="resolvedHref"
    :type="componentType === 'button' ? type : undefined"
  >
    <slot />
  </component>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, type RouteLocationRaw, useRouter } from "vue-router";

const props = withDefaults(
  defineProps<{
    href?: string;
    to?: RouteLocationRaw;
    variant?: "primary" | "secondary" | "tertiary" | "danger";
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "secondary",
    href: undefined,
    to: undefined,
    type: "button",
  },
);

const router = useRouter();
const resolvedHref = computed(() => {
  if (props.href) {
    return props.href;
  } else if (props.to && componentType.value === RouterLink) {
    // If `to` is an object, resolve it to a string URL
    return router.resolve(props.to).href;
  }
  return undefined;
});

const componentType = computed(() => {
  if (props.href) return "a";
  if (props.to) return RouterLink;
  return "button";
});
</script>
<style lang="postcss" scoped></style>
