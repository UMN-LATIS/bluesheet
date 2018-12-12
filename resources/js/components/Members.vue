<template>
    <div>
        <div class="form-check float-right">
          <input class="form-check-input" type="checkbox" v-model="includePreviousMembers" id="pastMembers">
          <label class="form-check-label" for="pastMembers">
            Include Previous Members
        </label>
    </div>
    <table class="table">
        <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">From</th>
              <th scope="col">Until</th>
          </tr>
      </thead>
      <tbody>
        <tr v-for="member in filteredList">
            <td><router-link :to="{ name: 'user', params: { userId: member.user.id } }" v-if="member.user.id">{{ member.user.displayName }}</router-link>
            <span v-if="!member.user.id">{{ member.user.displayName }}</span>
            </td>
            <td>{{ member.role.label }}</td>
            <td>{{ member.start_date | moment("YYYY, MMM do") }}</td>
            <td>{{ member.end_date  | moment("YYYY, MMM do") }}</td>
        </tr>
    </tbody>
  </table>
</div>
</template>

<script>
export default {
    props: ['members'],
    data() {
        return {
            includePreviousMembers: false
        }
    },
    mounted() {
    },
    computed: {
        filteredList: function() {
            return this.sortedList.filter(function(role) {
                if(role.end_date == null || this.includePreviousMembers) {
                    return role;
                }

            }.bind(this));
        },
        sortedList: function() {
            return this.members.sort(function (a, b) {
                return a.start_date < b.start_date;
            });
        }
    },
    methods: {

    }
}
</script>
