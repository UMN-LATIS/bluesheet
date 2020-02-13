<template>
    <div>
        <div class="alert alert-danger" role="alert" v-if="error">
            {{ error}}
        </div>
        <h1>{{ role.label}}</h1>
        <members :members="role.members" :editing="false" :roles="[role]" :show_unit="false" :filterList="null" groupType="department" :userperms='userperms' viewType="role"></members>


    </div>
</template>

<script>
    export default {
        props: ['roleId', 'userperms'],
        data() {
            return {
                error: null,
                role: {label:"", members: []},
                editing: false
            }
        },
        mounted() {
            axios.get("/api/role/" + this.roleId)
            .then(res => {
                this.role = res.data;
            })
            .catch(err => {
                this.error = err.response.data;
            });
        },
        methods: {
            
        }
    }
</script>
