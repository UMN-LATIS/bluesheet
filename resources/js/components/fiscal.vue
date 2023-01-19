<template>
    <div>
        <p>This list combines the following data. Clicking the "show email list" button will give you a de-duplicated
            set of email addresses.</p>
        <ul>
            <li>
                <router-link :to="{ name: 'role', params: { roleId: 24 } }">Finance Manager</router-link>
            </li>
            <li>
                <router-link :to="{ name: 'role', params: { roleId: 14 } }">Payroll Specialist</router-link>
            </li>
            <li>
                <router-link :to="{ name: 'role', params: { roleId: 11 } }">Accountant</router-link>
            </li>


        </ul>
        <table class="table">
        <thead>
            <tr>
                <th>
                    <sortableLink sortLabel="DeptId" sortElement="dept_id" :currentSort="currentSort"
                        :currentSortDir="currentSortDir" v-on:sort="sort" />
                </th>
                <th>
                    <sortableLink sortLabel="Department" sortElement="department" :currentSort="currentSort"
                        :currentSortDir="currentSortDir" v-on:sort="sort" />
                </th>
                <th>
                    <sortableLink sortLabel="Accountant" sortElement="accountant" :currentSort="currentSort"
                        :currentSortDir="currentSortDir" v-on:sort="sort" />
                </th>
                <th>
                    <sortableLink sortLabel="Finance Manager" sortElement="financeManager" :currentSort="currentSort"
                        :currentSortDir="currentSortDir" v-on:sort="sort" />
                </th>
                <th>
                    <sortableLink sortLabel="Payroll Specialist" sortElement="payrollSpecialist" :currentSort="currentSort"
                        :currentSortDir="currentSortDir" v-on:sort="sort" />
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="department in sortedListByDepartment" :key="department.dept_id" >
                <td>{{  department.dept_id }}</td>
                <td><router-link :to="{ name: 'group', params: { groupId: department.group.id } }">{{ department.department }}</router-link></td>
                <td><userWithLink :memberList=department.accountant></userWithLink></td>
                <td><userWithLink :memberList=department.financeManager></userWithLink></td>
                <td><userWithLink :memberList=department.payrollSpecialist></userWithLink></td>

            </tr>
        </tbody>
    </table>
    </div>
</template>

<script>
import userWithLink from "./userWithLink.vue";
export default {
    components:  {
        userWithLink
    },
    data() {
        return {
            groupList: [],
            groupsToLoad: [],
            currentSort: "dept_id",
            currentSortDir: "asc",
            listByDepartment: []
        }
    },
    async mounted() {

        for (let group of this.groupsToLoad) {
            var groupData = await axios.get("/api/group/" + group)
            await axios.get("/api/group/" + group + "/members")
                .then(res => {
                    this.groupList = [... this.groupList, ...res.data.map(g => {
                        g.group = groupData.data;
                        return g;
                    })];
                });
        }

        const roleList = [
            {
                "roleId": 24, // finance manager
                "groupType": null
            },
            {
                "roleId": 14, // payroll specialist
                "groupType": null
            },
            {
                "roleId": 11, // accountant
                "groupType": null
            }
        ];

        let fullList = [];
        for (let role of roleList) {
            await axios.get("/api/role/" + role.roleId)
                .then(res => {
                    let filteredMembers = res.data.members.filter(m => {
                        return !m.end_date || this.$moment(m.end_date).isAfter(this.$moment());
                    });

                    fullList = [...fullList, ...filteredMembers];
                })
        }
        let groups = fullList.map(m => {
            return m.group.id
        })
        let uniqueGroups = [...new Set(groups)];
        let listByDepartment = [];
        for (let group of uniqueGroups) {
            let members = fullList.filter(m => m.group.id == group);
            let outputObject = {};
            outputObject.dept_id = members[0].group.dept_id;
            outputObject.department = members[0].group.group_title;
            outputObject.group = members[0].group;
            outputObject.financeManager = members.filter(m => m.role.id == 24);
            outputObject.payrollSpecialist = members.filter(m => m.role.id == 14);
            outputObject.accountant = members.filter(m => m.role.id == 11);
            listByDepartment.push(outputObject);
        }
        this.listByDepartment = listByDepartment;


    },
    computed: {
        sortedListByDepartment: function() {
            return this.listByDepartment.sort((a, b) =>{
                let modifier = 1;
                if (this.currentSortDir === 'desc') modifier = -1;

                var a = window._.get(a, this.currentSort) || " ";
                var b = window._.get(b, this.currentSort) || " ";
                
                if(typeof a === "string") {
                    a = a.toLowerCase();
                }
                else {
                    if(a[0] && a[0].user && a[0].user.displayName) {
                        a = a[0].user.displayName.toLowerCase();
                    }
                    
                }

                if(typeof b === "string") {
                    b = b.toLowerCase();
                }
                else {
                    if(b[0] && b[0].user && b[0].user.displayName) {
                        b = b[0].user.displayName.toLowerCase();
                    }
                }

                if (a < b) return -1 * modifier;
                if (a > b) return 1 * modifier;
                return 0;
            });
        }
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
    }
}

</script>
