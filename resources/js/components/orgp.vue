<template>
    <div>
        <p>This list combines the following data. Clicking the "show email list" button will give you a de-duplicated
            set of email addreses.</p>
        <ul>
            <li>
                All department administrators for <router-link :to="{ name: 'role', params: { roleId: 23 } }">academic
                </router-link> and <router-link :to="{ name: 'role', params: { roleId: 39 } }">non-academic units
                </router-link>
            </li>
            <li>
                <router-link :to="{ name: 'role', params: { roleId: 22 } }">Academic Chairs</router-link>
            </li>
            <li>
                <router-link :to="{ name: 'role', params: { roleId: 30 } }">Graduate Program Coordinators</router-link>
            </li>
            <li>
                <router-link :to="{ name: 'role', params: { roleId: 18 } }">Director of Graduate Studies</router-link>
            </li>


        </ul>
        <members v-if="groupList" :members="groupList" :editing="false" :roles="[]" :show_unit="true" groupType="list"
            viewType="role" downloadTitle="ORGP" />
    </div>
</template>

<script>
export default {
    data() {
        return {
            groupList: [],
            groupsToLoad: []
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
                "roleId": 23, // academic chair
                "groupType": 3
            },
            {
                "roleId": 39, // academic chair
                "groupType": null
            },
            {
                "roleId": 22, // academic chair
                "groupType": null
            },
            {
                "roleId": 30, // Director
                "groupType": null
            },
            {
                "roleId": 18, // Research support center admin
                "groupType": null
            }
        ];

        for (let role of roleList) {
            await axios.get("/api/role/" + role.roleId)
                .then(res => {
                    let filteredMembers = null;
                    if (role.groupType) {
                        filteredMembers = res.data.members.filter(m => m.group.group_type_id == role.groupType);
                    }
                    else {
                        filteredMembers = res.data.members;;
                    }
                    this.groupList = [...this.groupList, ...filteredMembers];
                })
        }


    },
    computed: {

    },
    methods: {

    }
}

</script>
