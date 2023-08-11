<template>
  <tr class="leaves-table-row">
    <template v-if="state === 'edit'">
      <td class="!tw-pl-0">
        <InputGroup
          v-model="localLeave.description"
          label="Description"
          :showLabel="false"
          class="tw-mb-0"
          inputClass="tw-bg-neutral-100 tw-border-0 focus:!tw-ring-2 focus:!tw-ring-offset-2 focus:tw-border-blue-500 focus:tw-bg-neutral-100 tw-w-full"
        />
      </td>
      <td class="!tw-pl-0">
        <SelectGroup
          v-model="localLeave.type"
          label="Type"
          :showLabel="false"
          class="tw-mb-0"
          selectClass="tw-bg-neutral-100 tw-border-0 focus:!tw-ring-2 focus:!tw-ring-offset-2 focus:tw-border-blue-500 focus:tw-bg-neutral-100"
          :options="leaveTypeOptions"
        >
        </SelectGroup>
      </td>
      <td>{{ leave.status }}</td>
      <td>{{ dayjs(leave.start_date).format("YYYY-MM-DD") }}</td>
      <td>{{ dayjs(leave.end_date).format("YYYY-MM-DD") }}</td>
      <td>
        <Button variant="tertiary" @click="handleSaveEdit"> Save </Button>
        <Button variant="tertiary" @click="handleCancelEdit"> Cancel </Button>
      </td>
    </template>
    <template v-else>
      <td>{{ leave.description }}</td>
      <td>{{ leave.type }}</td>
      <td>{{ leave.status }}</td>
      <td>{{ dayjs(leave.start_date).format("YYYY-MM-DD") }}</td>
      <td>{{ dayjs(leave.end_date).format("YYYY-MM-DD") }}</td>
      <td>
        <Button variant="tertiary" @click="state = 'edit'"> Edit </Button>
        <Button
          variant="tertiary"
          class="tw-text-red-800 hover:tw-bg-red-50 hover:tw-text-red-600"
          @click="state = 'delete'"
        >
          Delete
        </Button>
      </td>
    </template>
  </tr>
</template>
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Leave, LeaveStatuses, LeaveTypes } from "@/types";
import { dayjs } from "@/lib";
import Button from "@/components/Button.vue";
import InputGroup from "./InputGroup.vue";
import SelectGroup from "./SelectGroup.vue";

const props = defineProps<{
  leave: Leave;
}>();

const emit = defineEmits<{
  (eventName: "update", leave: Leave);
}>();

const localLeave = ref<Leave>(props.leave);
const state = ref<"idle" | "edit" | "delete">("idle");

const capitalizeEachWord = (str: string) =>
  str
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");

const leaveTypeOptions = computed(() => {
  return Object.entries(LeaveTypes).map(([text, value]) => ({
    value,
    text: capitalizeEachWord(text),
  }));
});

const leaveStatusOptions = computed(() => {
  return Object.entries(LeaveStatuses).map(([text, value]) => ({
    value,
    text: capitalizeEachWord(text.replace("_", " ").toLowerCase()),
  }));
});

const isDescriptionValid = computed(
  () => !!localLeave.value.description.length,
);
const isStatusValid = computed(() => !!localLeave.value.status);
const isTypeValid = computed(() => !!localLeave.value.type);
const isStartDateValid = computed(() =>
  dayjs(localLeave.value.start_date).isValid(),
);
const isEndDateValid = computed(
  () =>
    dayjs(localLeave.value.end_date).isValid() &&
    isStartDateValid.value &&
    dayjs(localLeave.value.end_date).isAfter(
      dayjs(localLeave.value.start_date),
    ),
);

const isRowValid = computed(
  () =>
    isDescriptionValid.value &&
    isStatusValid.value &&
    isTypeValid.value &&
    isStartDateValid.value &&
    isEndDateValid.value,
);

function handleCancelEdit() {
  localLeave.value = props.leave;
  state.value = "idle";
}

function handleSaveEdit() {
  if (!isRowValid.value) return;
  emit("update", localLeave.value);
  state.value = "idle";
}

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
}
</style>
