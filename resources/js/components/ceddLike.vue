<template>
    <div>
        <p>This list combines the following data. Clicking the "show email list" button will give you a de-duplicated set of email addreses.</p>
        <ul>
            <li>
                 <router-link :to="{ name: 'group', params: { groupId: 20 } }">All members of the CLA Administrators' Forum (department administrators for academic and non-academic units)</router-link> (users who are members of the Admin Forum group)</li>
            <li><router-link :to="{ name: 'role', params: { roleId: 22 } }">All members of Council of Chairs (all faculty leaders for the 31 academic departments)</router-link> (all users with "Academic Chair" role)</li>
            <li><router-link :to="{ name: 'role', params: { roleId: 22 } }">All CLA center directors (users with the role "director" in a group of type "center"</router-link></li>
            <li><router-link :to="{ name: 'group', params: { groupId: 129 } }">All members of the CLA Executive Committee</router-link></li>
            <li><router-link :to="{ name: 'group', params: { groupId: 128 } }">All Dean's Group members</router-link></li>
            <li><router-link :to="{ name: 'group', params: { groupId: 83 } }">All OLT members</router-link></li>
            <li><router-link :to="{ name: 'group', params: { groupId: 130 } }">And a list of other misc people </router-link></li>
        </ul>
        <members v-if="groupList" :members="groupList" :editing="false" :roles="[]" :show_unit="true" groupType="list" viewType="role" downloadTitle="CEDD Like"/>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                groupList: [],
                groupsToLoad: [20, 83, 128, 129, 130]
            }
        },
        async mounted() {
            
            for(let group of this.groupsToLoad) {
                var groupData = await axios.get("/api/group/" + group)
                await axios.get("/api/group/" + group + "/members")
                .then(res => {
                    this.groupList = [... this.groupList, ... res.data.map(g => {
                        g.group = groupData.data;
                        return g;
                    })];
                });
            }
            


            // var adminGroup = await axios.get("/api/role/22")
            await axios.get("/api/role/22")
                .then(res => {
                    this.groupList = [...this.groupList, ... res.data.members];
                })

            // var adminGroup = await axios.get("/api/role/22")
            await axios.get("/api/role/40")
                .then(res => {

                    var onlyCenterDirectors = res.data.members.filter(m => m.group.group_type_id == 5);
                    this.groupList = [...this.groupList, ... onlyCenterDirectors];
                })

        },
        computed: {
           
        },
        methods: {
            
        }
    }

</script>
