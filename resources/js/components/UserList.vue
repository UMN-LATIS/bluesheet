<template>
    <div>
        <table class="table">
            <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Current Membership Count</th>
              </tr>
          </thead>
          <tbody>
            <tr v-for="user in loadedUsers">
                <td><router-link :to="{ name: 'user', params: { userId: user.id } }" v-if="user.id">
                {{ user.surname }}, {{ user.givenname }}
              </router-link></td>
                <td>{{ user.memberships.filter((elem)=>{ return elem.end_date == null}).length }}</td>
            </tr>
        </tbody>
    </table>
</div>
</template>

<script>
    export default {
        props: ['users', 'userperms'],
        data() {
            return {
              loadedUsers: []
            }
        },
        mounted() {
          axios.post("/api/user/lookup/", {users:this.users})
          .then(res => {
             this.loadedUsers = res.data.users;
          })
          .catch(err => {
              this.error = err.response.data.message;
          });
        }
    }
</script>
