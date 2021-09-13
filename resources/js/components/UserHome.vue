<template>
    <div>
        <div class="alert alert-danger" role="alert" v-if="error">
            {{ error}}
        </div>
        <viewuser :user="user" v-if="user">
        </viewuser>
        <div class="col-md-6" v-if="user && !userId">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="user.send_email_reminders" @change="updateUser" id="send_email_reminders">
                <label class="form-check-label small" for="send_email_reminders">
                    Send me occasional reminders to update my groups
                </label>
            </div>
        </div>
        <roles :memberships="memberships" id="v-step-4"></roles>
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
        props: ['userId'],
        data() {
            return {
                error: null,
                user: null
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
            updateUser() {
                axios.put('/api/user/' + this.user.id, this.user);
            },
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
