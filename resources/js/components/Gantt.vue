<template>
  <tbody>
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
    <GanttRow
      v-for="member in members"
      :key="member.id"
      :show_unit="show_unit"
      :member="member"
      :mindate="mindate"
      :maxdate="maxdate"
      :filterList="filterList"
      @update:member="(updatedMember) => $emit('update:member', updatedMember)"
    />

    <tr>
      <th v-if="filterList" width="5%"></th>
      <th width="20%"></th>
      <th colspan="6" width="80%">
        <span>{{ mindate ? dayjs(mindate).format("YYYY-MM-DD") : '' }}</span>
        <span class="float-right">
          {{ maxdate ? dayjs(maxdate).format("YYYY-MM-DD") : '' }}
        </span>
      </th>
    </tr>
  </tbody>
</template>

<script lang="ts">
import GanttRow from "./GanttRow.vue";
import { dayjs } from "@/lib";
import { max, min } from "lodash";

export default {
  components: {
    GanttRow,
  },
  props: ["members", "mindate", "maxdate", "show_unit", "filterList"],
  emits: ["update:member"],
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
  }
};
</script>

<style scoped>
tbody tr {
  border-top: 1px solid lightgray;
  border-bottom: 1px solid lightgray;
  line-height: 2em;
}
</style>
