<template>
  <ComboBox
    label="Person on leave"
    placeholder="Search the department…"
    :showLabel="false"
    :options="options"
    :modelValue="chosenOption"
    strategy="fixed"
    teleportTo="body"
    @update:modelValue="(option) => emit('choose', numberOrNull(option?.id))"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ComboBox, type ComboBoxOptionType } from "@/components/ComboBox";
import type { SisEmployee } from "@/types";
import { lastNameFirst } from "@/utils/lastNameFirst";

const props = defineProps<{
  roster: SisEmployee[];
  emplid: number | null;
}>();

const emit = defineEmits<{ choose: [emplid: number | null] }>();

const options = computed<ComboBoxOptionType[]>(() =>
  props.roster.map((person) => ({
    id: person.emplid,
    label: lastNameFirst(person.name ?? String(person.emplid), person.lastName),
    secondaryLabel: person.positionTitle ?? undefined,
  })),
);

const chosenOption = computed(
  () => options.value.find(({ id }) => id === props.emplid) ?? null,
);

const numberOrNull = (id: string | number | undefined) =>
  typeof id === "number" ? id : null;
</script>
