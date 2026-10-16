<template>
  <BudgetTableRow
    class="tw-bg-surface-bright"
    :class="{ 'tw-cursor-pointer hover:tw-bg-surface': emplid !== null }"
    @click="selectPersonUnlessOnControl"
  >
    <slot />
  </BudgetTableRow>
</template>

<script setup lang="ts">
import BudgetTableRow from "./BudgetTableRow.vue";

const props = defineProps<{ emplid: number | null }>();

const emit = defineEmits<{ selectPerson: [emplid: number] }>();

const CONTROLS_WITH_THEIR_OWN_CLICK =
  "a, button, input, label, select, textarea";

function selectPersonUnlessOnControl(event: MouseEvent) {
  if (props.emplid === null) return;

  const target = event.target as Element;
  if (target.closest(CONTROLS_WITH_THEIR_OWN_CLICK)) return;

  emit("selectPerson", props.emplid);
}
</script>
