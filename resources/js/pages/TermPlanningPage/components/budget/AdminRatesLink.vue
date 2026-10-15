<template>
  <a
    v-if="permissions.can(UserPermissions.EDIT_USERS)"
    :href="`/admin/resources/${novaResourceUriKey}`"
    target="_blank"
    class="tw-text-xs tw-font-semibold tw-text-bs-blue hover:tw-underline"
  >
    Edit rates in admin
  </a>
</template>

<script setup lang="ts">
import { usePermissionsStore } from "@/stores/usePermissionsStore";
import { UserPermissions } from "@/types";

defineProps<{
  novaResourceUriKey: "job-code-term-rates" | "grad-term-rates";
}>();

const permissions = usePermissionsStore();
</script>
