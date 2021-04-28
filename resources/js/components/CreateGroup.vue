<template>
    <modal :show="show" @close="close">
        <div class="form-group row">
            <label for="internetId" class="col-sm-3 col-form-label">Group Name:</label>
            <div class="col-sm-6">
                <input type="text" ref="groupNameRef" class="form-control" id="groupName" v-on:keyup="groupNameError = null" @keyup.enter="createGroup" placeholder="Group Name" v-model="groupName">
            </div>
        </div>
        <div class="form-group row">
                <label for="groupType" class="col-sm-3 col-form-label">Group Type</label>
                <div class="col-sm-6">
                    <v-select v-if="groupTypes" id="groupTypes" taggable v-model="groupType" :options="groupTypes" placeholder="Select..."></v-select>
                </div>
        </div>
        <div class="form-group row">
                <label for="parentOrganization" class="col-sm-3 col-form-label">Folder</label>
                <div class="col-sm-6">
                    <folder-widget v-model="parentOrganization"></folder-widget>
                     
                </div>
        </div>
        <div class="form-group row">
            <div class="col-sm-4">
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

<style scoped>

.vue-treeselect__control {
    border: 1px solid rgba(60,60,60,.26);
}

</style>

<script>
    export default {
        props: ['show'],
        data() {
            return {
                groupNameError: null,
                groupName: null,
                groupType: null,
                groupTypes: [],
                parentOrganization: null,
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
            axios.get("/api/group/types")
            .then(res => {
                this.groupTypes = res.data;
            })
            .catch(err => {

            });
        },
        methods: {
            close: function () {
                this.groupName = null;
                this.$emit('close');
            },
            createGroup: function() {
                if(this.groupName == null) {
                    this.groupNameError = "You must enter a group name";
                    return;
                }
                if(this.groupType == null ) {
                    this.groupNameError = "You must select a group type";
                    return;
                }
                if(this.parentOrganization == null) {
                    this.groupNameError = "You must select a folder";
                    return;
                }
                this.groupNameError = null;
                axios.post("/api/group", {"groupName": this.groupName, "groupType":this.groupType, 'parentOrganization':this.parentOrganization})
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
