<template>
    <div>
        <div class="form-group col-6">
            <treeselect v-model="filterOrg" :multiple="false" :options="parentOrganizations"  :clearable="false" :searchable="true" :open-on-click="true" :close-on-select="true" label="group_title" v-if="parentOrganizations.length" value-consists-of="ALL" :flat="false"/>
        </div>
        <table class="table">
            <thead>
                <tr>
                    <th scope="col">Group Name</th>
              </tr>
          </thead>
          <tbody>
            <tr v-for="(group, key) in sortedFilteredGroupList" v-if="groupList">
                <td v-if="group.active"><router-link :to="{ name: 'group', params: { groupId: group.id } }">
                        <group-title :group="group" />
                    </router-link></td>
                
            </tr>
        </tbody>
    </table>
     <div class="form-group col-md-6">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="includeSubgroups" id="subgroups">
              <label class="form-check-label " for="subgroups">
                Include Sub-groups
              </label>
            </div>
          </div>
</div>
</template>

<script>
    export default {
        data() {
            return {
                groupList: [],
                error: null,
                filterOrg: 'All Groups',
                parentOrganizations: [],
                includeSubgroups: false
            }
        },
        mounted() {
            this.loadGroups();
        },
        computed: {
            sortedFilteredGroupList: function() {
                return _.sortBy(this.groupList, [group => group.group_title.toLowerCase()]).filter((e)=>{
                    if(this.filterOrg == 'All Groups' || (e.parent_organization && this.getChildrenOrgs(this.filterOrg, this.parentOrganizations).includes(e.parent_organization.id))) {
                        return e;
                    }
                }).filter( x => (this.includeSubgroups || x.parent_group_id == null));
            }
        },
        methods: {
            remapParents: function(p) {
                return p.map(org => { var result = {"id": org.id, "label": org.group_title }; if(org.child_organizations_recursive.length > 0) { result.children = this.remapParents(org.child_organizations_recursive)}; return result; });
            },
            flatten: function(items) {
                const flat = [];

                items.forEach(item => {
                  if (Array.isArray(item)) {
                    flat.push(...this.flatten(item));
                } else {
                    flat.push(item);
                }
                });

                return flat;
            },
            getChildrenOrgs: function(targetId, targetGroup) {
                for(var org of targetGroup) {
                    if(org.id == targetId) {
                        return this.flatten([org.id, this.getAllChildren(org.children)]);
                    }
                    else if(org.children) {
                        return this.getChildrenOrgs(targetId, org.children);    
                    }
                }
                return [];

            },
            getAllChildren: function(org) {
                var returnArray = [];
                if(!org) {
                    return returnArray;
                }
                for(var child of org) {
                    returnArray.push(child.id);
                    if(child.children) {
                        returnArray.push(this.getAllChildren(child.children));    
                    }
                    
                }
                return returnArray;
            },
            loadGroups() {
                axios.get("/api/group/")
                .then(res => {
                    this.groupList = res.data;
                })
                .catch(err => {
                    this.error = err.response.data;
                });
                 axios.get("/api/group/parents")
                 .then(res => {
                    this.parentOrganizations = this.remapParents(res.data);
                    this.parentOrganizations.unshift({id: "All Groups", label: 'All Groups'});
                })
                .catch(err => {

                });
            }
        }
    }
</script>
