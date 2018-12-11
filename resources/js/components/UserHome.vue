<template>
    <div class="container">
        <div class="alert alert-danger" role="alert" v-if="error">
            {{ error}}
        </div>
        <button class="btn btn-outline-primary float-right" @click="editing=!editing">Edit User</button>
        <viewuser :user="user" v-if="!editing && user">
        </viewuser>
        <edituser :user="user" v-if="editing && user">
        </edituser>
        <roles :memberships="memberships" ></roles>
    </div>
</template>

<script>
    export default {
        props: ['userId'],
        data() {
            return {
                error: null,
                user: null,
                editing: false
            }
        },
        mounted() {
            this.loadUser();
        },
        computed: {
            memberships: function() {
                if(this.user) {
                    return this.user.memberships;    
                }
                return [];
            }
        },
        methods: {
            loadUser() {
                this.error = null;
                var targetUser = "local";
                if(this.userId) {
                    targetUser = this.userId;
                }
                axios.get("/api/user/" + targetUser)
                .then(res => {
                    this.user = res.data;
                })
                .catch(err => {
                    this.error = err.response.data;
                });

            }
        }
    }
</script>
