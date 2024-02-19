<template>
  <tr>
    <td v-if="filterList">
      <input
        type="checkbox"
        :value="member.filtered"
        @input="
          $emit('update:member', {
            ...member,
            filtered: ($event.target as HTMLInputElement).value,
          })
        "
      />
    </td>
    <td class="tw-leading-tight">
      <p class="tw-m-0">{{ member.user.displayName }}</p>
      <small class="tw-text-xs tw-text-neutral-500">{{ member.role.label }}</small>
    </td>
    <td colspan="6">
      <div
        v-tooltip.top-center="toolTipText"
        class="ganttBubble"
        :style="{ width: width + '%', 'margin-left': startPercent + '%' }"
      ></div>
    </td>
  </tr>
</template>

<script lang="ts">
import $ from "jquery";
import { dayjs } from "@/utils";
import { PropType } from "vue";
import { Membership } from "@/types";

$(function () {
  $("[data-toggle='tooltip']").tooltip();
});
export default {
  props: {
    member: {
      type: Object as PropType<Membership>,
      required: true,
    },
    mindate: {
      type: Number,
      required: true,
    },
    maxdate: {
      type: Number,
      required: true,
    },
    showUnit: {
      type: Boolean,
      default: true,
    },
    filterList: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:member"],
  data() {
    return {};
  },
  computed: {
    toolTipText: function () {
      var returnString = this.member.user.displayName + "<br>";
      if (this.member.user.ou && this.showUnit) {
        returnString += "Unit: " + this.member.user.ou + "<br>";
      }
      if (this.member.notes) {
        returnString += "Notes: " + this.member.notes + "<br>";
      }
      returnString += "From: " + this.member.start_date + "<br>";
      if (this.member.end_date) {
        returnString += "<br>Until: " + this.member.end_date;
      }
      return returnString;
    },
    startPercent: function () {
      return (
        ((this.startDate - this.mindate) / (this.maxdate - this.mindate)) * 100
      );
    },

    startDate: function () {
      return dayjs(this.member.start_date).unix();
    },
    endDate: function () {
      if (this.member.end_date) {
        return dayjs(this.member.end_date).unix();
      }
      return this.maxdate;
    },
    width: function () {
      return (
        ((this.endDate - this.mindate) / (this.maxdate - this.mindate)) * 100 -
        this.startPercent
      );
    },
  },
};
</script>

<style scoped>
.ganttBubble {
  border: 1px black solid;
  background-color: lightblue;
  border-radius: 10px;
  height: 20px;
}
</style>
