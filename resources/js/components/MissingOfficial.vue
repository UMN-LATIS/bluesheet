<template>
    <div>
         <div class="form-group row">
                <label for="officialRole" class="col-sm-2 col-form-label">Filter by Official Role</label>
                <div class="col-sm-6">
                    <v-select v-if="officialRoles" id="groupTypes"  v-model="officialRoleFilter" :options="officialRoles" placeholder="Select..."></v-select>
                 
                </div>
        </div>
      <table class="table">
        <thead>
            <tr>
                <th>
                    <sortableLink sortLabel="Group" sortElement="group_title" :currentSort="currentSort"
                        :currentSortDir="currentSortDir" v-on:sort="sort" />
                </th>
                <th>
                    Missing Roles
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="group in filteredList" :key="group.id" >
                <td>
                    <router-link :to="{ name: 'group', params: { groupId: group.id } }">
                        <group-title :group="group" />
                    </router-link>
                </td>
                <td>
                    <ul>
                        <li v-for="(unfilledRole, key) in unfilledRoles(group)" :key="key">
                            {{ unfilledRole.label }}
                        </li>
                    </ul>
                </td>
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
            currentSort: "group_title",
            currentSortDir: "asc",
            officialRoleFilter: null,
            roles: []
        }
    },
    computed: {
        filteredList: function() {
            let departmentList = this.groupList.filter(g => g.group_type.label == "Department");
            return departmentList.sort((a, b) =>{
                let modifier = 1;
                if (this.currentSortDir === 'desc') modifier = -1;

                var a = window._.get(a, this.currentSort) || " ";
                var b = window._.get(b, this.currentSort) || " ";

                if (a.toLowerCase() < b.toLowerCase()) return -1 * modifier;
                if (a.toLowerCase() > b.toLowerCase()) return 1 * modifier;
                return 0;
            }).filter(g => this.unfilledRoles(g).length > 0);
        },
        officialRoles: function () {
            return this.roles.filter(r => r.official_group_type?r.official_group_type.map(gt=>gt.label).includes("Department"):false);
        },
        officialRoleCategories: function () {
            var allOfficialRoles = this.officialRoles ? this.officialRoles.map(r => r.official_role_category.category)
                : [];
            return [...new Set(allOfficialRoles)];
        },

    },
    methods: {
        sort: function (s) {
            //if s == current sort, reverse
            if (s === this.currentSort) {
                this.currentSortDir = this.currentSortDir === 'asc' ? 'desc' : 'asc';
            } else {
                this.currentSortDir = 'asc';
            }
            this.currentSort = s;
        },
        unfilledRoles: function(group) {
            if(this.officialRoleFilter) {
                return group.active_members.map(m => m.role_id?m.role_id:null).includes(this.officialRoleFilter.id)?[]:[this.officialRoleFilter]
            }
            else {
                return this.officialRoles.filter(r => !group.active_members.map(m => m.role_id?m.role_id:null).includes(r.id));
            }
        }
    },
    mounted() {
        axios.get("/api/group/")
        .then(res => {
            this.groupList = res.data;
        });
        axios.get("/api/group/roles/")
        .then(res => {
            this.roles = res.data;
        })
        .catch(err => {
            this.error = err.response.data;
        });
    }

    
}
</script>