<template>
  <div>
    <div class="form-check float-right">
      <input
        id="pastRoles"
        v-model="includePastRoles"
        class="form-check-input"
        type="checkbox"
      />
      <label class="form-check-label" for="pastRoles">
        Include Past Roles
      </label>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th scope="col">Group</th>
          <th scope="col">Role</th>
          <th scope="col">From</th>
          <th scope="col">Until</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(membership, index) in filteredList" :key="index">
          <td>
            <router-link
              v-if="membership.group.id"
              :to="{ name: 'group', params: { groupId: membership.group.id } }"
              ><GroupTitle :group="membership.group"
            /></router-link>
            <span v-if="!membership.group.id"
              ><GroupTitle :group="membership.group"
            /></span>
          </td>
          <td>{{ membership.role.label }}</td>
          <td>{{ membership.start_date | moment("YYYY, MMM Do") }}</td>
          <td>{{ membership.end_date | moment("YYYY, MMM Do") }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import GroupTitle from "../components/GroupTitle.vue";

export default {
  components: {
    GroupTitle,
  },
  props: ["memberships"],
  data() {
    return {
      includePastRoles: false,
    };
  },
  computed: {
    filteredList: function () {
      return this.sortedList.filter(
        function (role) {
          if (
            this.includePastRoles ||
            role.end_date == null ||
            this.$moment(role.end_date).isAfter(this.$moment())
          ) {
            return role;
          }
        }.bind(this),
      );
    },
    sortedList: function () {
      return [...this.memberships].sort((a, b) => {
        const dateA = dayjs(a.start_date);
        const dateB = dayjs(b.start_date);

        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      });
    },
  },
  methods: {},
};
</script>
