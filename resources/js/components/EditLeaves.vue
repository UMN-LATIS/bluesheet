<template>
  <div>
    <strong
      >Editing stuff goes here. But like, not yet, cause our data model is a
      mess.</strong
    >
    <table class="table">
      <thead>
        <td>Description</td>
        <td>Type</td>
        <td>Status</td>
        <td>Start Date</td>
        <td>End Date</td>
      </thead>
      <tbody>
        <tr v-for="leave in leaves" :key="leave.id">
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
export default {
  props: ["leaves"],
};
</script>
