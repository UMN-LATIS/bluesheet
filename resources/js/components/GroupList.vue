<template>
    <div>
        <nav class="breadcrumb">
            <router-link v-for="breadcrumb in breadCrumbs" :key="breadcrumb.title" class="breadcrumb-item" :to="{path: breadcrumb.path}" active-class="active" exact-active-class="" exact>{{ breadcrumb.title }}</router-link>
            <!-- <a class="breadcrumb-item" href="#"></a> -->
            <!-- <span class="breadcrumb-item active"></span> -->
        </nav>

         <table class="table" v-if="currentOrganizations.length > 0">
            <thead>
                <tr>
                    <th scope="col">Child Organizations</th>
              </tr>
          </thead>
          <tbody>
                <tr v-for="currentOrg in currentOrganizations" :key="currentOrg.id" >
                <td><router-link :to='{ path: "/groups/" + currentOrg.id }'>{{ currentOrg.label }}</router-link>
                </td>
            </tr>
          </tbody>
         </table>



        <table class="table" v-if="sortedFilteredGroupList.length > 0">
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
          <div class="form-group col-md-6" v-if="!parent">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="showAllGroups" id="allGroups">
              <label class="form-check-label " for="allGroups">
                Show All Groups
              </label>
            </div>
          </div>
</div>
</template>

<script>
    export default {
        props: ["parent"],
        data() {
            return {
                groupList: [],
                error: null,
                parentOrganizations: [],
                includeSubgroups: false,
                showAllGroups: false
            }
        },
        mounted() {
            this.loadGroups();
        },
        computed: {
            breadCrumbs: function() {
                if(this.parentOrganizations.length == 0) {
                    return [];
                }

                var pathToItem = this.getPathToChild(this.parent, this.parentOrganizations);

                var cumulativeRoute = [];
                var breadCrumbArray = [{"title":"Groups", "path": "/groups/"}];
                console.log(pathToItem)
                for(var item of pathToItem) {
                    cumulativeRoute.push(item);

                    breadCrumbArray.push({"title": item.label, "path": "/groups/" + item.id});
                }
                return breadCrumbArray;
            },
            currentOrganizations: function() {
                if(!this.parent) {
                    return this.parentOrganizations;
                }
                else {
                    return this.getChildrenOrgs(this.parent, this.parentOrganizations).filter(o => o.id != this.parent);
                }
                
            },
            sortedFilteredGroupList: function() {
                if(this.showAllGroups) {
                    return _.sortBy(this.groupList, [group => group.group_title.toLowerCase()]);
                }
                return _.sortBy(this.groupList, [group => group.group_title.toLowerCase()]).filter((e)=>{
                    if(e.parent_organization && e.parent_organization.id == this.parent) {
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
            getPathToChild: function(targetId, targetGroup) {
                if(!targetId) {
                    return [];
                }
                for(var org of targetGroup) {
                    if(org.id == targetId) {
                        // we've found our target, flatten the rest
                        return [org];
                    }
                    else if(org.children) {
                        // walk the tree to find our target
                        return this.flatten([org, this.getPathToChild(targetId, org.children)]);
                    }
                }
                return [];
            },
            getChildrenOrgs: function(targetId, targetGroup) {
                for(var org of targetGroup) {
                    if(org.id == targetId) {
                        // we've found our target, flatten the rest
                        return this.flatten([org, this.getAllChildren(org.children)]);
                    }
                    else if(org.children) {
                        // walk the tree to find our target
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
                    returnArray.push(child);
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
                })
                .catch(err => {

                });
            }
        }
    }
</script>
