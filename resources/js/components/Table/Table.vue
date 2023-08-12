<template>
  <div class="tw-px-4 sm:tw-px-6 lg:tw-px-8">
    <div class="sm:tw-flex sm:tw-items-center">
      <div class="sm:tw-flex-auto">
        <h1 class="tw-text-base tw-font-semibold tw-leading-6 tw-text-gray-900">
          {{ name }}
        </h1>
        <p class="tw-mt-2 tw-text-sm tw-text-gray-700">
          {{ description }}
        </p>
      </div>
      <div class="tw-mt-4 sm:tw-ml-16 sm:tw-mt-0 sm:tw-flex-none">
        <slot name="actions" />
      </div>
    </div>
    <div class="tw-mt-8 tw-flow-root">
      <div class="tw--mx-4 tw--my-2 tw-overflow-x-auto sm:tw--mx-6 lg:tw--mx-8">
        <div
          class="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle sm:tw-px-6 lg:tw-px-8"
        >
          <div
            class="tw-overflow-hidden tw-shadow tw-ring-1 tw-ring-black tw-ring-opacity-5 sm:tw-rounded-lg"
          >
            <table class="tw-min-w-full tw-divide-y tw-divide-gray-300">
              <thead class="tw-bg-gray-50">
                <slot name="thead" />
              </thead>
              <tbody class="tw-divide-y tw-divide-gray-200 tw-bg-white">
                <slot />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  name: string;
  description?: string;
}>();
</script>
<style scoped></style>
