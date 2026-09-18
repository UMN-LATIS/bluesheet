<template>
  <aside
    aria-label="Section details"
    class="tw-flex tw-h-full tw-w-full tw-min-h-0 tw-flex-col tw-bg-surface-bright tw-text-on-surface"
  >
    <PanelHeader
      :title="`${section.subject} ${section.catalogNumber} · ${section.section}`"
      :subtitle="section.title"
      @close="emit('close')"
    >
      <template #tags>
        <span
          class="tw-inline-flex tw-h-5 tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-text-[10px] tw-font-bold tw-tracking-[0.07em] tw-text-on-surface"
          :class="colorOfType(section.component).badge"
        >
          {{ section.component }}
        </span>
        <span
          v-if="section.isPlanned"
          class="tw-inline-flex tw-h-5 tw-flex-none tw-items-center tw-rounded-full tw-border tw-border-dashed tw-border-outline tw-px-2 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-on-surface-variant"
        >
          Planned
        </span>
      </template>
      <template #meta>
        <router-link
          :to="termPlanningPage"
          class="tw-text-primary hover:tw-underline"
        >
          {{ termName }}
        </router-link>
        <span v-if="section.isPlanned">· Planned in Term Planning</span>
      </template>
    </PanelHeader>

    <div
      class="scrollbar-always-visible tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-y-auto tw-p-[18px]"
    >
      <div class="tw-flex tw-items-start tw-gap-8">
        <div>
          <FieldLabel class="tw-mb-px">Section</FieldLabel>
          <FactValue>{{ section.section }}</FactValue>
        </div>
        <div>
          <FieldLabel class="tw-mb-px">Enrollment</FieldLabel>
          <div class="tw-flex tw-items-baseline tw-gap-2">
            <FactValue>
              {{ section.enrollmentTotal ?? "—" }} / {{ section.enrollmentCap }}
            </FactValue>
            <span class="tw-text-xs tw-text-on-surface-variant">
              {{ section.enrollmentTotal === null ? "cap" : "enrolled of cap" }}
            </span>
          </div>
        </div>
      </div>

      <div>
        <FieldLabel class="tw-mb-px">Taught by</FieldLabel>
        <PeopleList :people="instructors" emptyLabel="TBA" />
      </div>

      <div>
        <FieldLabel class="tw-mb-px">Teaching assistants</FieldLabel>
        <PeopleList :people="teachingAssistants" emptyLabel="None" />
      </div>

      <FieldDivider />

      <router-link
        :to="termPlanningPage"
        class="tw-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-text-primary"
      >
        Open in Term Planning
        <ArrowRightIcon class="!tw-h-3.5 !tw-w-3.5" aria-hidden="true" />
      </router-link>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowRightIcon } from "@/icons";
import type { PlanningPerson, TeachingSection } from "@/types";
import { colorOfType } from "@/utils/meetingTypeColors";
import FactValue from "@/components/planning/FactValue.vue";
import FieldDivider from "@/components/planning/FieldDivider.vue";
import FieldLabel from "@/components/planning/FieldLabel.vue";
import PanelHeader from "@/components/planning/PanelHeader.vue";
import PeopleList, { type ListedPerson } from "./PeopleList.vue";

const props = defineProps<{
  section: TeachingSection;
  termName: string;
  groupId: number;
  peopleByEmplid: Map<number, PlanningPerson>;
}>();

const emit = defineEmits<{ close: [] }>();

const ROLE_LABELS: Record<string, string> = {
  PI: "Instructor of record",
  SI: "Secondary instructor",
  TA: "Teaching assistant",
};

const termPlanningPage = computed(() => ({
  name: "termPlanning",
  params: { groupId: props.groupId, termCode: props.section.termCode },
}));

const listedPeopleWithRoles = (roles: string[]): ListedPerson[] =>
  props.section.instructors
    .filter(({ role }) => roles.includes(role))
    .map(({ emplid, role }) => ({
      emplid,
      name: props.peopleByEmplid.get(emplid)?.name || `Employee ${emplid}`,
      role: ROLE_LABELS[role] ?? role,
    }));

const instructors = computed(() => listedPeopleWithRoles(["PI", "SI"]));
const teachingAssistants = computed(() => listedPeopleWithRoles(["TA"]));
</script>
