<template>
  <div>
    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    <ViewUser v-if="user" :user="user" />
    <div v-if="user && !userId" class="col-md-6">
      <div class="form-check">
        <input
          id="send_email_reminders"
          v-model="user.send_email_reminders"
          class="form-check-input"
          type="checkbox"
          @change="api.updateUser(user)"
        />
        <label class="form-check-label small" for="send_email_reminders">
          Send me occasional reminders to update my groups
        </label>
      </div>
    </div>
    <div v-if="user && !userId" class="col-md-6">
      <div class="form-check">
        <input
          id="notify_of_favorite_changes"
          v-model="user.notify_of_favorite_changes"
          class="form-check-input"
          type="checkbox"
          @change="api.updateUser(user)"
        />
        <label class="form-check-label small" for="notify_of_favorite_changes">
          Notify me when my favorite groups and roles change
        </label>
      </div>
    </div>
    <Roles id="v-step-4" :memberships="memberships"></Roles>

    <Leaves
      v-if="user && user.leaves"
      :leaves="user.leaves"
      :userId="user.id"
      @update="handleUpdateLeaves"
      class="tw-mt-12"
    ></Leaves>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from "vue";
import ViewUser from "@/components/ViewUser.vue";
import Roles from "@/components/Roles.vue";
import Leaves from "@/components/Leaves.vue";
import * as api from "@/api";
import { User } from "@/types";
import { useStore } from "vuex";
import { AxiosError } from "axios";

const props = defineProps<{
  userId: number | null;
}>();

const user = ref<User | null>(null);
const error = ref<string | null>(null);

const memberships = computed(() => {
  return user.value?.memberships ?? [];
});

const store = useStore();

watch(
  () => [props.userId, store.state.user],
  () => {
    if (!props.userId && !store.state.user?.id) {
      return;
    }

    loadUser(props.userId ?? store.state.user.id);
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
