<template>
  <tr v-show="isPersonVisible" class="instructor-table-row">
    <Td class="instructor-column">
      <RouterLink :to="`/user/${person.id}`">
        <div
          class="tw-truncate"
          :class="{
            'tw-bg-yellow-100': isPersonHighlighted,
          }"
        >
          {{ person.surName }}, {{ person.givenName }}
        </div>
      </RouterLink>
      <div class="tw-text-xs tw-text-neutral-400 tw-flex tw-flex-col">
        <span class="tw-truncate">
          {{ person.title }}
          {{ person.jobCode ? `(${person.jobCode})` : "" }}
        </span>
        <span>{{ person.emplid }}</span>
        <span v-if="person.sslApplyEligible">✦ SSL Apply Eligible </span>
        <span v-if="person.sslEligible">✦ SSL Eligible</span>
        <span v-if="person.midcareerEligible">✦ Midcareer Eligible</span>
      </div>
    </Td>
    <Td
      v-for="term in coursePlanningStore.terms"
      v-show="coursePlanningStore.isTermVisible(term.id)"
      :key="term.id"
      class="term-data-column tw-group"
      :class="{
        'term-data-column--current': coursePlanningStore.isCurrentTerm(term.id),
        'term-data-column--fall': term.name.includes('Fall'),
      }"
    >
      <PersonTableCell :person="person" :term="term" />
    </Td>
  </tr>
</template>
<script setup lang="ts">
import { Td } from "@/components/Table";
import PersonTableCell from "./PersonTableCell.vue";
import { Person } from "../coursePlanningTypes";
import { useRootCoursePlanningStore } from "../stores/useRootCoursePlanningStore";
import { computed } from "vue";

const props = defineProps<{
  person: Person;
}>();

const coursePlanningStore = useRootCoursePlanningStore();
const isPersonVisible = computed(() =>
  coursePlanningStore.isPersonVisible(props.person),
);

const isPersonHighlighted = computed(
  () =>
    coursePlanningStore.filters.search.length &&
    coursePlanningStore.isPersonMatchingSearch(props.person),
);
</script>
<style scoped>
.term-data-column {
  border-left: 1px solid #f3f3f3;
}

.term-data-column.term-data-column--current {
  background: #fffcf0;
  border-top: 1px solid #fde68a;
}

.term-data-column.term-data-column--current.term-data-column--fall {
  border-left: 2px solid #fde68a;
}

.term-data-column.term-data-column--fall {
  border-left: 2px solid #f3f3f3;
}
.instructor-table-row:hover .instructor-column {
  background-color: #f3f3f3;
}
</style>
