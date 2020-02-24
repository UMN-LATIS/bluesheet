<template>
    <div>
        <div class="alert alert-danger" role="alert" v-if="error">
            {{ error}}
        </div>
        <viewuser :user="user" v-if="!editing && user" v-bind:editing.sync="editing" :userperms="userperms">
        </viewuser>
        <edituser :user="user" v-if="editing && user" v-bind:editing.sync="editing" :userperms="userperms">
        </edituser>
        <roles :memberships="memberships" ></roles>

        <div class="row mt-5" v-if="user">
            <div class="col" v-if="user.favoriteGroups.length > 0">
                <h3>Favorite Groups</h3>
                <favorites v-if="!userId" :user="user" type="group"></favorites>
            </div>
            <div class="col" v-if="user.favoriteRoles.length > 0">
                <h3>Favorite Roles</h3>
                <favorites v-if="!userId" :user="user" type="role"></favorites>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['userId', 'userperms'],
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
        watch: {
            userId: function(){
                this.loadUser();
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
