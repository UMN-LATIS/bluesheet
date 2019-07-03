<template>
    <div>
        <div class="form-check float-right">
          <input class="form-check-input" type="checkbox" v-model="includePastRoles" id="pastRoles">
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
        <tr v-for="membership in filteredList">
            <td><router-link :to="{ name: 'group', params: { groupId: membership.group.id } }" v-if="membership.group.id">{{ membership.group.group_title }}</router-link>
            <span v-if="!membership.group.id">{{ membership.group.group_title }}</span>
            </td>
            <td>{{ membership.role.label }}</td>
            <td>{{ membership.start_date | moment("YYYY, MMM Do") }}</td>
            <td>{{ membership.end_date  | moment("YYYY, MMM Do") }}</td>
        </tr>
    </tbody>
  </table>
</div>
</template>

<script>
export default {
    props: ['memberships'],
    data() {
        return {
            includePastRoles: false
        }
    },
    mounted() {
    },
    computed: {
        filteredList: function() {
            return this.sortedList.filter(function(role) {
                if(this.includePastRoles || role.end_date == NULL || this.$moment(role.end_date).isAfter(this.$moment())) {
                    return role;
                }

            }.bind(this));
        },
        sortedList: function() {
            return this.memberships.sort(function (a, b) {
                return a.start_date < b.start_date;
            });
        }
    },
    methods: {

    }
}
</script>
