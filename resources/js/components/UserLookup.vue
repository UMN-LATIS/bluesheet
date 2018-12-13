<template>
    <modal :show="show" @close="close">
        <div class="form-group row">
            <label for="internetId" class="col-sm-3 col-form-label">Internet ID:</label>
            <div class="col-sm-6">
                <input type="text" ref="findMemberRef" class="form-control" id="internetId" v-on:keyup="findUserError = null" @keyup.enter="lookupUser" placeholder="Internet ID" v-model="userLookupId">
            </div>
            <div class="col-sm-3">
                <button class="btn btn-primary" @click="lookupUser">Find User</button>
            </div>
        </div>
        <div class="row">
            <div class="alert alert-danger col-sm-12" role="alert" v-if="findUserError">
                {{ findUserError }}
            </div>

        </div>

    </modal>
</template>

<script>
    export default {
        props: ['show'],
        data() {
            return {
                findUserError: null,
                userLookupId: null,
            }
        },
        watch: {
            show: function(newVal, oldVal) {
                if(newVal) {
                    this.$nextTick(() => {
                        this.$refs.findMemberRef.focus();
                    });
                }
            }
        },
        mounted() {
        },
        methods: {
            close: function () {
                this.userLookupId = null;
                this.$emit('close');
            },
            lookupUser: function() {
                axios.get("/api/user/lookup/" + this.userLookupId)
                .then(res => {
                    this.$router.push({ name: 'user', params: {'userId': res.data.id}});
                    this.close();
                })
                .catch(err => {
                    this.findUserError = err.response.data.message;
                });
                
            }
        }
    }
</script>
