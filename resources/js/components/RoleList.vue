<template>
    <div>
       
        <table class="table">
            <thead>
                <tr>
                    <th scope="col">Role</th>
              </tr>
          </thead>
          <tbody>
            <tr v-for="(role, key) in roleList" v-if="roleList">
                <td><router-link :to="{ name: 'role', params: { roleId: role.id } }">{{ role.label }}</router-link></td>
                
            </tr>
        </tbody>
    </table>
</div>
</template>

<script>
    export default {
        data() {
            return {
                roleList: [],
                error: null,
            }
        },
        mounted() {
            this.loadRoles();
        },
        methods: {
            loadRoles() {
                axios.get("/api/group/roles")
                .then(res => {
                    this.roleList = res.data;
                })
                .catch(err => {
                    this.error = err.response.data;
                });
            }
        }
    }
</script>
