<template>
  <Menu as="div" class="tw-relative tw-inline-block tw-text-left">
    <div>
      <MenuButton
        class="tw-flex tw-items-center tw-rounded-full tw-bg-transparent tw-text-neutral-400 hover:tw-text-neutral-600 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-ring-offset-2 focus:tw-ring-offset-neutral-100 tw-border-0 tw-aspect-square tw-cursor-pointer"
      >
        <span class="tw-sr-only">Open options</span>
        <VDotsIcon class="tw-h-4 tw-w-4" aria-hidden="true" />
      </MenuButton>
    </div>

    <Transition
      enterActiveClass="tw-transition tw-ease-out tw-duration-100"
      enterFromClass="tw-transform tw-opacity-0 tw-scale-95"
      enterToClass="tw-transform tw-opacity-100 tw-scale-100"
      leaveActiveClass="tw-transition tw-ease-in tw-duration-75"
      leaveFromClass="tw-transform tw-opacity-100 tw-scale-100"
      leaveToClass="tw-transform tw-opacity-0 tw-scale-95"
    >
      <MenuItems
        class="tw-absolute tw-right-0 tw-z-10 tw-mt-2 tw-max-w-56 tw-origin-top-right tw-rounded-md tw-bg-white tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none tw-cursor-pointer"
      >
        <div class="tw-py-1">
          <slot />
        </div>
      </MenuItems>
    </Transition>
  </Menu>
</template>

<script setup>
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
import { VDotsIcon } from "@/icons";
</script>
