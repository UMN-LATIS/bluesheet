<template>
  <table class="table">
    <thead>
      <tr>
        <th v-if="filterList" scope="col" width="5%">Filter</th>
        <th scope="col">
          <SortableLink
            sortLabel="Name"
            sortElement="user.surname"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
            @sort="$emit('sort', $event)"
          />
        </th>
        <th colspan="6" width="80%">
          <span>{{ minDatePretty }}</span>
          <span class="float-right">
            {{ maxDatePretty }}
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <GanttRow
        v-for="member in members"
        :key="member.id"
        :show_unit="show_unit"
        :member="member"
        :mindate="mindate"
        :maxdate="maxdate"
        :filterList="filterList"
        @update:member="
          (updatedMember) => $emit('update:member', updatedMember)
        "
      />

      <tr>
        <th v-if="filterList" width="5%"></th>
        <th width="20%"></th>
        <th colspan="6" width="80%">
          <span>{{ minDatePretty }}</span>
          <span class="float-right">
            {{ maxDatePretty }}
          </span>
        </th>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import GanttRow from "./GanttRow.vue";
import SortableLink from "./SortableLink.vue";
import { dayjs } from "@/utils";

export default {
  components: {
    SortableLink,
    GanttRow,
  },
  props: [
    "members",
    "mindate",
    "maxdate",
    "show_unit",
    "filterList",
    "currentSort",
    "currentSortDir",
  ],
  emits: ["update:member", "sort"],
  data() {
    return {};
  },
  computed: {
    minDatePretty() {
      return dayjs.unix(this.mindate).format("YYYY-MM-DD");
    },
    maxDatePretty() {
      return dayjs.unix(this.maxdate).format("YYYY-MM-DD");
    },
  },
  methods: {
    dayjs,
  },
};
</script>

<style scoped>
tbody tr {
  border-top: 1px solid lightgray;
  border-bottom: 1px solid lightgray;
  line-height: 2em;
}
</style>
