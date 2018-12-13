<template>
    <modal :show="show" @close="close">
        <div class="form-group row">
            <label for="internetId" class="col-sm-3 col-form-label">Group Name:</label>
            <div class="col-sm-6">
                <input type="text" ref="groupNameRef" class="form-control" id="groupName" v-on:keyup="groupNameError = null" @keyup.enter="createGroup" placeholder="Group Name" v-model="groupName">
            </div>
            <div class="col-sm-3">
                <button class="btn btn-primary" @click="createGroup">Create Group</button>
            </div>
        </div>
        <div class="row">
            <div class="alert alert-danger col-sm-12" role="alert" v-if="groupNameError">
                {{ groupNameError }}
            </div>

        </div>

    </modal>
</template>

<script>
    export default {
        props: ['show'],
        data() {
            return {
                groupNameError: null,
                groupName: null,
            }
        },
        watch: {
            show: function(newVal, oldVal) {
                if(newVal) {
                    this.$nextTick(() => {
                        this.$refs.groupNameRef.focus();
                    });
                }
            }
        },
        mounted() {
        },
        methods: {
            close: function () {
                this.groupName = null;
                this.$emit('close');
            },
            createGroup: function() {
                axios.post("/api/group/", {"groupName": this.groupName})
                .then(res => {
                    this.$router.push({ name: 'group', params: {'groupId': res.data.id}});
                    this.close();
                })
                .catch(err => {
                    this.groupNameError = err.response.data.message;
                });
                
            }
        }
    }
</script>
