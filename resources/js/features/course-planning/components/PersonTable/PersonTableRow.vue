<template>
  <tr v-if="isPersonVisible" class="instructor-table-row">
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
      v-for="term in coursePlanningStore.termsStore.terms"
      v-show="isTermVisible(term.id)"
      :key="term.id"
      class="term-data-column tw-group tw-h-full"
      :class="{
        'term-data-column--current':
          coursePlanningStore.termsStore.isCurrentTerm(term.id),
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
import { Person } from "@/types";
import { useCoursePlanningStore } from "../../stores/useCoursePlanningStore";
import { computed } from "vue";
import { Term } from "@/types";

const props = defineProps<{
  person: Person;
}>();

const coursePlanningStore = useCoursePlanningStore();

const isPersonVisible = computed(() =>
  coursePlanningStore.isPersonVisible(props.person.emplid),
);

const isPersonHighlighted = computed(
  () =>
    coursePlanningStore.filters.search.length &&
    coursePlanningStore.isPersonMatchingSearch(props.person),
);

const isTermVisibleLookup = computed(() =>
  coursePlanningStore.termsStore.terms.reduce(
    (acc, term) => ({
      ...acc,
      [term.id]: coursePlanningStore.isTermVisible(term.id),
    }),
    {} as Record<string, boolean>,
  ),
);

function isTermVisible(termId: Term["id"]) {
  return isTermVisibleLookup.value[termId];
}
</script>
<style scoped>
.term-data-column {
  border-left: 1px solid #f3f3f3;
}

.term-data-column.term-data-column--current {
  background: rgb(255 248 220 / 68%);
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
