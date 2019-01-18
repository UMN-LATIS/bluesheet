<template>
    <div>
        <div class="form-group col-6">
            <v-select v-model="filterOrg" :options="parentOrganizations" label="parent_organization" v-if="parentOrganizations"></v-select>
        </div>
        <table class="table">
            <thead>
                <tr>
                    <th scope="col">Group Name</th>
              </tr>
          </thead>
          <tbody>
            <tr v-for="(group, key) in sortedFilteredGroupList" v-if="groupList">
                <td v-if="group.active"><router-link :to="{ name: 'group', params: { groupId: group.id } }">{{ group.group_title }}</router-link></td>
                
            </tr>
        </tbody>
    </table>
</div>
</template>

<script>
    export default {
        data() {
            return {
                groupList: [],
                error: null,
                filterOrg: 'All Groups'
            }
        },
        mounted() {
            this.loadGroups();
        },
        computed: {
            sortedFilteredGroupList: function() {
                return _.sortBy(this.groupList, [group => group.group_title.toLowerCase()]).filter((e)=>{
                    if(this.filterOrg == 'All Groups' || (e.parent_organization && e.parent_organization.group_title == this.filterOrg)) {
                        return e;
                    }
                });
            },
            parentOrganizations: function() {
                var po = this.groupList.map(e=>e.parent_organization?e.parent_organization.group_title:null).filter(Boolean).sort();
                po.unshift('All Groups');
                return _.uniq(po);
            }
        },
        methods: {
            loadGroups() {
                axios.get("/api/group/")
                .then(res => {
                    this.groupList = res.data;
                })
                .catch(err => {
                    this.error = err.response.data;
                });

            }
        }
    }
</script>
