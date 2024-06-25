<template>
  <div>
    <div class="tw-flex tw-flex-wrap tw-gap-4 tw-items-baseline tw-mb-6">
      <h1 class="tw-m-0">{{ user.displayName }}</h1>
      <Button
        v-if="$can('edit users')"
        variant="tertiary"
        :href="`/admin/users/${user.id}/edit`"
        class="tw-text-bs-blue tw--ml-2 tw-bg-blue-50"
      >
        Edit User
      </Button>
    </div>
    <dl class="user-details-list">
      <template v-if="user.title">
        <dt>Title</dt>
        <dd>{{ user.title }}</dd>
      </template>
      <template v-if="user.office">
        <dt>Office</dt>
        <dd v-html="formattedOffice" />
      </template>
      <template v-if="user.email">
        <dt>Email</dt>
        <dd>
          <a :href="`mailto:${user.email}`">{{ user.email }}</a>
        </dd>
      </template>
      <dt>More Info</dt>
      <dd>
        <a
          :href="'http://myaccount.umn.edu/lookup?UID=' + usernameOnly"
          target="_blank"
          class="tw-flex tw-items-baseline tw-text-bs-blue tw-gap-1"
        >
          Directory Entry
          <ExternalLinkIcon
            class="!tw-w-4 !tw-h-4 tw-text-bs-blue tw-self-center"
          />
        </a>
      </dd>
      <template
        v-if="$can(UserPermissions.VIEW_ANY_LEAVES) && hasLeaveEligibility"
      >
        <dt>Eligiblity</dt>
        <dd>
          <div v-if="user.ssl_eligible" class="chiclet">
            Single Semester Leave Eligible (SSL)
          </div>
          <div v-if="user.ssl_apply_eligible" class="chiclet">
            Eligible to apply for SSL
          </div>
          <div v-if="user.midcareer_eligible" class="chiclet">
            Mid-career Eligible
          </div>
        </dd>
      </template>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Button from "./Button.vue";
import { $can } from "@/utils";
import { User } from "@/types";
import { ExternalLinkIcon } from "@/icons";
import { UserPermissions } from "@/types";

const props = defineProps<{
  user: User;
}>();

const usernameOnly = computed(() => {
  return props.user.email?.split("@").shift() ?? "";
});

const formattedOffice = computed(() => {
  if (!props.user.office) return "";
  return props.user.office.replace(/ \$ /g, "<br />");
});

const hasLeaveEligibility = computed(() => {
  return (
    props.user.ssl_eligible ||
    props.user.ssl_apply_eligible ||
    props.user.midcareer_eligible
  );
});
</script>

<style scoped>
ul {
  list-style: none;
}
ul li {
  margin-top: 5px;
  margin-bottom: 5px;
}

.user-details-list {
  max-width: 480px;
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 0 1rem;
  align-items: baseline;
  margin-top: 1rem;
  margin-bottom: 1rem;

  & dt {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
  }
}
</style>
