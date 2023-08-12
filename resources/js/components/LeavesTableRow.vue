<template>
  <tr class="leaves-table-row">
    <td>
      <!-- {{ leave.description }} -->
      <InputGroup
        v-model="localLeave.description"
        label="description"
        :show-label="false"
        class="tw-mb-0"
        input-class="tw-border-neutral-200"
      />
    </td>
    <td>{{ leave.type }}</td>
    <td>{{ leave.status }}</td>
    <td>{{ dayjs(leave.start_date).format("YYYY-MM-DD") }}</td>
    <td>{{ dayjs(leave.end_date).format("YYYY-MM-DD") }}</td>
    <td>
      <div v-if="state === 'idle'">
        <Button variant="tertiary" @click="state = 'edit'"> Edit </Button>
        <Button
          variant="tertiary"
          class="tw-text-red-800 hover:tw-bg-red-50 hover:tw-text-red-600"
          @click="handleDeleteClick"
        >
          Delete
        </Button>
      </div>
      <div v-if="state === 'edit'">
        <Button variant="tertiary" @click="handleSaveEdit">Save</Button>
        <Button variant="tertiary" @click="handleCancelEdit">Cancel</Button>
      </div>
    </td>
  </tr>
</template>
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Leave, leaveStatuses, leaveTypes } from "@/types";
import { dayjs } from "@/lib";
import Button from "@/components/Button.vue";
import InputGroup from "./InputGroup.vue";

const props = defineProps<{
  leave: Leave;
}>();

const emit = defineEmits<{
  (eventName: "update", leave: Leave);
}>();

const localLeave = ref<Leave>(props.leave);
const state = ref<"idle" | "edit" | "delete">("idle");

function handleCancelEdit() {
  localLeave.value = props.leave;
  state.value = "idle";
}

function handleSaveEdit() {
  emit("update", localLeave.value);
  state.value = "idle";
}

function handleDeleteClick() {}

watch(
  () => props.leave,
  (newVal) => {
    localLeave.value = newVal;
  },
);
</script>
<style scoped>
.leaves-table-row td {
  vertical-align: middle;
  padding: 0.5rem 0.5rem 0.5rem 0;
}
</style>
