<template>
  <!--
    For pages that are an application screen rather than a document: the
    page owns the whole viewport and lays itself out inside `main`, which
    never scrolls as a whole. The bar keeps the University header's gold rule
    and maroon mark but at a fraction of its height, so the screen below
    gets the room.
  -->
  <div class="tw-flex tw-h-screen tw-flex-col tw-bg-umn-neutral-50">
    <header
      class="tw-flex tw-h-9 tw-flex-none tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-t-4 tw-border-solid tw-border-b-neutral-200 tw-border-t-umn-gold tw-bg-white tw-px-3"
    >
      <router-link
        :to="{ name: 'home' }"
        class="tw-flex tw-items-center tw-gap-2 tw-text-umn-maroon tw-no-underline hover:tw-text-umn-maroon hover:tw-no-underline"
      >
        <BlockM class="tw-h-4" />
        <span class="tw-text-sm tw-font-semibold tw-tracking-tight">
          BlueSheet
        </span>
      </router-link>

      <nav aria-label="Account" class="tw-flex tw-gap-4 tw-text-xs">
        <a
          href="https://umn-latis.github.io/bluesheet/"
          target="_blank"
          rel="noopener"
          :class="LINK_CLASS"
        >
          Help
        </a>
        <a href="/shibboleth-logout" :class="LINK_CLASS">Log out</a>
      </nav>
    </header>

    <main class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import BlockM from "@/components/BlockM.vue";

const LINK_CLASS =
  "tw-text-neutral-600 tw-no-underline hover:tw-text-neutral-900 hover:tw-underline";
</script>
