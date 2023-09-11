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
        <aside v-if="user && isCurrentUser" class="tw-max-w-xs">
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

      <Leaves
        v-if="user && user.leaves"
        :leaves="user.leaves"
        :userId="user.id"
        class="tw-mt-12"
        @update="handleUpdateLeaves"
      ></Leaves>
    </template>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import ViewUser from "@/components/ViewUser.vue";
import Roles from "@/components/Roles.vue";
import Leaves from "@/components/Leaves.vue";
import * as api from "@/api";
import { User } from "@/types";
import { useStore } from "vuex";
import { AxiosError } from "axios";
import CheckboxGroup from "@/components/CheckboxGroup.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

const props = defineProps<{
  userId: number | null;
}>();

const user = ref<User | null>(null);
const error = ref<string | null>(null);
const isCurrentUser = computed(() => {
  return user.value?.id === store.state.user?.id;
});

const memberships = computed(() => {
  return user.value?.memberships ?? [];
});

const store = useStore();
const isLoadingUser = ref(false);

watch(
  [() => props.userId, () => store.state.user],
  async () => {
    if (isLoadingUser.value) return;

    // if we're using current user, and it's not loaded, wait
    if (props.userId === null) {
      user.value = store.state.user;
      return;
    }

    // if the userId matches the current user, use the current user
    if (props.userId === store.state.user?.id) {
      user.value = store.state.user;
      return;
    }

    // otherwise, load the user
    isLoadingUser.value = true;
    await loadUser(props.userId);
    isLoadingUser.value = false;
  },
  { immediate: true },
);

async function loadUser(userId: number) {
  error.value = null;
  try {
    user.value = await api.getUser(userId);
  } catch (err) {
    console.error(err);
    error.value =
      (err as AxiosError).response?.data ??
      "Sorry. There was a problem loading the user.";
  }
}

async function handleUpdateLeaves(leaves) {
  if (!user.value?.leaves) {
    // this would only happen if someone had 'edit leaves' privileges
    // but not 'view leaves' privileges
    throw new Error("Cannot update leaves on user without leaves");
  }

  try {
    user.value.leaves = await api.updateUserLeaves(user.value.id, leaves);
  } catch (err) {
    console.error(err);
    error.value = "Sorry. There was a problem updating the leaves.";
  }
}
</script>
