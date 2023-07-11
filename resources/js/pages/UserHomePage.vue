<template>
    <div>
        <div class="alert alert-danger" role="alert" v-if="error">
            {{ error}}
        </div>
        <ViewUser :user="user" v-if="user" />
        <div class="col-md-6" v-if="user && !userId">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="user.send_email_reminders" @change="updateUser" id="send_email_reminders">
                <label class="form-check-label small" for="send_email_reminders">
                    Send me occasional reminders to update my groups
                </label>
            </div>
        </div>
        <div class="col-md-6" v-if="user && !userId">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="user.notify_of_favorite_changes" @change="updateUser" id="notify_of_favorite_changes">
                <label class="form-check-label small" for="notify_of_favorite_changes">
                    Notify me when my favorite groups and roles change
                </label>
            </div>
        </div>
        <roles :memberships="memberships" id="v-step-4"></roles>
    </div>
</template>

<script>
import ViewUser from '../components/ViewUser.vue';
import Roles from '../components/Roles.vue';
    export default {
        props: ['userId'],
        components: {
            ViewUser,
            Roles
        },
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
