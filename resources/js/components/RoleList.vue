<template>
    <div>
       
        <table class="table">
            <thead>
                <tr>
                    <th scope="col">Official Departmental Roles</th>
              </tr>
          </thead>
          <tbody v-if="roleList">
            <tr v-for="(role, key) in roleList.filter(r=>r.official_group_type)"  :key="key">
                <td><router-link :to="{ name: 'role', params: { roleId: role.id } }">{{ role.label }}</router-link></td>
                
            </tr>
        </tbody>
        </table>
         <table class="table">
            <thead>
                <tr>
                    <th scope="col">Unofficial Roles</th>
              </tr>
          </thead>
          <tbody v-if="roleList">
            <tr v-for="(role, key) in roleList.filter(r=>!r.official_group_type)" :key="key">
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
