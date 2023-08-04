<template>
  <div>
    <div class="form-check float-right">
      <input
        id="pastLeaves"
        v-model="includePastLeaves"
        class="form-check-input"
        type="checkbox"
      />
      <label class="form-check-label" for="pastLeaves">
        Include Past Leaves
      </label>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Type</th>
          <th>Status</th>
          <th>Start Date</th>
          <th>End Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="leave in filteredLeaves" :key="leave.id">
          <td>{{ leave.description }}</td>
          <td>{{ leave.type }}</td>
          <td>{{ leave.status }}</td>
          <td>{{ leave.start_date }}</td>
          <td>{{ leave.end_date }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
import LeaveConstants from "../constants.js";
import { dayjs } from "@/lib";

export default {
  props: ["leaves"],
  data() {
    return {
      includePastLeaves: false,
    };
  },
  computed: {
    filteredLeaves: function () {
      // if includePastLeaves is not checked, only return leaves whose end_date is in the future
      return this.leaves.filter(
        (l) => this.includePastLeaves || dayjs(l.end_date).isAfter(dayjs()),
      );
    },
  },
  methods: {
    dayjs,
  },
};
</script>
