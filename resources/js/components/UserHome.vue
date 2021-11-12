<template>
    <div>
        <div class="alert alert-danger" role="alert" v-if="error">
            {{ error}}
        </div>
        <viewuser :user="user" v-if="user">
        </viewuser>
        <roles :memberships="memberships" id="v-step-4"></roles>

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
