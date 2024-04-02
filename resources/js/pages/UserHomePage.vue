<template>
  <DefaultLayout>
    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    <template v-if="user">
      <div
        class="tw-flex tw-justify-between tw-flex-wrap tw-gap-4 tw-items-baseline"
      >
        <ViewUser :user="user" />
        <aside
          v-if="user && isCurrentUser"
          class="tw-max-w-xs tw-bg-neutral-100 tw-p-4 tw-rounded-md tw-w-full"
        >
          <h2
            class="tw-inline-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-mb-4"
          >
            Notifications
          </h2>
          <CheckboxGroup
            id="notify_of_favorite_changes"
            v-model="user.notify_of_favorite_changes"
            label="Changes"
            description="Notify me when my favorite groups and roles change."
            @update:modelValue="api.updateUser(user)"
          />
          <CheckboxGroup
            id="send_email_reminders"
            v-model="user.send_email_reminders"
            label="Reminders"
            description="Send me occasional reminders to update my groups."
            @update:modelValue="api.updateUser(user)"
          />
        </aside>
      </div>

      <Roles id="v-step-4" :memberships="memberships" class="tw-mt-12"></Roles>

      <LeavesTable
        v-if="user.leaves"
        :leaves="user.leaves"
        :userId="user.id"
        class="tw-mt-12"
      />
    </template>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import ViewUser from "@/components/ViewUser.vue";
import Roles from "@/components/Roles.vue";
import LeavesTable from "@/components/LeavesTable";
import * as api from "@/api";
import CheckboxGroup from "@/components/CheckboxGroup.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { usePageTitle } from "@/utils/usePageTitle";
import { useUserStore } from "@/stores/useUserStore";
import { $can } from "@/utils";
import { UserPermissions } from "@/types";

const props = defineProps<{
  userId: number | null;
}>();

const userStore = useUserStore();

const user = computed(() => {
  return props.userId
    ? userStore.getUserRef(props.userId).value
    : userStore.currentUser;
});

const error = ref<string | null>(null);
const isCurrentUser = computed(() => props.userId === null);

watch(
  () => props.userId,
  () => {
    props.userId
      ? userStore.loadUser(props.userId)
      : userStore.loadCurrentUser();
  },
  { immediate: true },
);

const memberships = computed(() => {
  return user.value?.memberships ?? [];
});

watch(user, () => usePageTitle(user.value?.displayName ?? ""), {
  immediate: true,
});
</script>
