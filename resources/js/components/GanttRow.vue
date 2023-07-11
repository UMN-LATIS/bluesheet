<template>
  <tr>
    <td v-if="filterList">
      <input
        type="checkbox"
        :value="member.filtered"
        @input="
          $emit('update:member', { ...member, filtered: $event.target.value })
        "
      />
    </td>
    <td>{{ member.user.displayName }}</td>
    <td colspan="6">
      <div
        v-tooltip.top-center="toolTipText"
        class="ganttBubble"
        :style="{ width: width + '%', 'margin-left': startPercent + '%' }"
      ></div>
    </td>
  </tr>
</template>

<script>
import $ from "jquery";

$(function () {
  $("[data-toggle='tooltip']").tooltip();
});
export default {
  props: ["member", "mindate", "maxdate", "show_unit", "filterList"],
  emits: ["update:member"],
  data() {
    return {};
  },
  computed: {
    toolTipText: function () {
      var returnString = this.member.user.displayName + "<br>";
      if (this.member.user.ou && this.show_unit) {
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
      return this.$moment(this.member.start_date).unix();
    },
    endDate: function () {
      if (this.member.end_date) {
        return this.$moment(this.member.end_date).unix();
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
