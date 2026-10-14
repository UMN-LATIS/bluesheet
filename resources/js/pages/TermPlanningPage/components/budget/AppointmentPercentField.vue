<template>
  <EditableCell
    v-if="appointment"
    class="tw-h-9 tw-w-20 tw-flex-none tw-overflow-hidden tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright"
    kind="appointment"
    :amount="appointment.percent"
    :amountWithoutOverride="appointment.percentWithoutOverride"
    :isOverridden="appointment.isOverridden"
    :canEdit="canEdit"
    :label="label"
    @change="(percent) => emit('change', percent)"
  />
</template>

<script setup lang="ts">
import EditableCell from "./EditableCell.vue";
import type { SectionAppointment } from "../../helpers/termEstimate";

defineProps<{
  appointment: SectionAppointment | undefined;
  canEdit: boolean;
  label: string;
}>();

const emit = defineEmits<{ change: [percent: number | null] }>();
</script>
