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
                    <v-select v-if="groupTypes" id="groupTypes" taggable v-model="groupType" :options="groupTypes"></v-select>
                </div>
        </div>
        <div class="form-group row" v-if="parentOrganizations">
                <label for="parentOrganization" class="col-sm-3 col-form-label">Parent Organization</label>
                <div class="col-sm-6">
                     <treeselect v-model="parentOrganization" :multiple="false" :options="parentOrganizations"  :clearable="false" :searchable="true" :open-on-click="true" :close-on-select="true" label="group_title"/>
                </div>
        </div>
        <div class="form-group row">
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
                parentOrganizations: [],
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
            axios.get("/api/group/parents")
            .then(res => {
                this.parentOrganizations = this.remapParents(res.data);
            })
            .catch(err => {

            });
        },
        methods: {
            remapParents: function(p) {
                return p.map(org => { var result = {"id": org.id, "label": org.group_title }; if(org.child_organizations_recursive.length > 0) { result.children = this.remapParents(org.child_organizations_recursive)}; return result; });
            },
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
                    this.groupNameError = "You must select a parent organization";
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
