<template>
  <div
    class="notification tw-rounded-md tw-max-w-lg tw-mx-auto tw-overflow-hidden tw-relative"
  >
    <button
      v-if="isDismissable"
      class="tw-absolute tw-top-0 tw-right-0 tw-p-4 tw-border-none tw-bg-transparent"
      @click="$emit('dismiss')"
    >
      <span class="tw-sr-only">Close</span>
      <XIcon />
    </button>
    <div
      class="tw-flex tw-gap-4 tw-p-4 tw-border-0 tw-border-l-8 tw-items-start tw-border-solid"
      :class="{
        'notification--info tw-border-l-blue-600': type === 'info',
        'notification--warning tw-border-l-yellow-300': type === 'warning',
        'notification--error tw-border-l-red-400': type === 'danger',
        'notification--success tw-border-l-green-400': type === 'success',
      }"
    >
      <div class="notification__icon tw-rounded-full tw-p-2 tw--mt-1">
        <WarningIcon v-if="type === 'warning'" />
        <InfoIcon v-if="type === 'info'" />
        <CircleCheckIcon v-if="type === 'success'" />
        <CircleXIcon v-if="type === 'danger'" />
      </div>
      <div class="tw-flex-1">
        <h3
          class="notification__title tw-text-sm tw-font-bold tw-uppercase tw-pr-6"
        >
          {{ title }}
        </h3>
        <div class="notification__contents tw-mt-2 tw-text-sm">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { WarningIcon, InfoIcon, CircleCheckIcon, CircleXIcon } from "@/icons";
import { XIcon } from "@/icons";

withDefaults(
  defineProps<{
    title?: string;
    type?: "warning" | "info" | "success" | "danger";
    isDismissable?: boolean;
  }>(),
  {
    title: "Heads Up",
    type: "info",
    isDismissable: false,
  },
);

defineEmits<{
  (eventName: "dismiss"): void;
}>();
</script>
<style scoped>
.notification {
  /** Notification **/
  --app-notification-borderColor: var(--color-neutral-200);
  --app-notification-backgroundColor: var(--color-neutral-50);
  --app-notification-textColor: var(--color-neutral-900);
  --app-notification-header-textColor: var(--color-neutral-900);
  --app-notification-icon-info-backgroundColor: var(--color-blue-100);
  --app-notification-icon-info-textColor: var(--color-blue-900);
  --app-notification-icon-warning-backgroundColor: var(--color-yellow-100);
  --app-notification-icon-warning-textColor: var(--color-yellow-500);
  --app-notification-icon-error-backgroundColor: var(--color-red-100);
  --app-notification-icon-error-textColor: var(--color-red-600);
  --app-notification-icon-success-backgroundColor: var(--color-green-100);
  --app-notification-icon-success-textColor: var(--color-green-600);

  background: var(--app-notification-backgroundColor);
  color: var(--app-notification-textColor);
  border-color: var(--app-notification-borderColor);
}

.notification__title {
  background: var(--app-notification-header-backgroundColor);
  color: var(--app-notification-header-textColor);
}
.notification__icon {
  background: var(--app-notification-icon-info-backgroundColor);
  color: var(--app-notification-icon-info-textColor);
}
.notification--warning .notification__icon {
  background: var(--app-notification-icon-warning-backgroundColor);
  color: var(--app-notification-icon-warning-textColor);
}
.notification--error .notification__icon {
  background: var(--app-notification-icon-error-backgroundColor);
  color: var(--app-notification-icon-error-textColor);
}
.notification--success .notification__icon {
  background: var(--app-notification-icon-success-backgroundColor);
  color: var(--app-notification-icon-success-textColor);
}
</style>
