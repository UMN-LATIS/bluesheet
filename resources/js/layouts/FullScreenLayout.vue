<template>
  <!--
    For pages that are an application screen rather than a document: the page
    owns the whole viewport and lays itself out inside `main`, which never
    scrolls as a whole.

    The bar carries the University's mark and the two account links, and gives
    the middle of its width to the page. Folding the page's own title and
    controls into this one row rather than stacking a second row under it is
    what leaves a full-height canvas below on a laptop screen.
  -->
  <div
    class="tw-flex tw-h-screen tw-flex-col tw-bg-surface-container tw-text-on-surface"
  >
    <header
      class="tw-flex tw-h-12 tw-flex-none tw-items-center tw-gap-3 tw-px-3 roomy:tw-h-[52px] roomy:tw-gap-4 roomy:tw-px-4"
    >
      <router-link
        :to="{ name: 'home' }"
        class="tw-flex tw-flex-none tw-items-center tw-gap-2 tw-text-brand tw-no-underline hover:tw-text-brand hover:tw-no-underline"
      >
        <BlockM class="tw-h-4 roomy:tw-h-[17px]" />
        <!-- The wordmark is the first thing to go when the bar gets tight;
             the Block M alone still says whose application this is. -->
        <span
          class="tw-hidden tw-text-sm tw-font-bold tw-tracking-tight cramped:tw-inline"
        >
          BlueSheet
        </span>
      </router-link>

      <span class="tw-h-5 tw-w-px tw-flex-none tw-bg-outline-variant" />

      <!-- The page's own title and controls. Anything pushed right with
           `ml-auto` here lands just before the account links. -->
      <div class="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
        <slot name="bar" />
      </div>

      <!-- Last to appear: on a narrow screen the page's own controls need
           the width more than a link to the docs does. -->
      <span
        class="tw-h-5 tw-w-px tw-flex-none tw-bg-outline-variant tw-hidden roomy:tw-block"
      />
      <nav
        aria-label="Account"
        class="tw-hidden tw-flex-none tw-gap-4 tw-text-xs roomy:tw-flex"
      >
        <a
          href="https://umn-latis.github.io/bluesheet/"
          target="_blank"
          rel="noopener"
          class="tw-text-on-surface-variant tw-no-underline hover:tw-text-on-surface hover:tw-underline"
        >
          Help
        </a>
        <a
          href="/shibboleth-logout"
          class="tw-text-on-surface-variant tw-no-underline hover:tw-text-on-surface hover:tw-underline"
        >
          Log out
        </a>
      </nav>
    </header>

    <main class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import BlockM from "@/components/BlockM.vue";
</script>
