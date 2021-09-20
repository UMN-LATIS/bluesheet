<template>
    <div>
        <p>This list combines the following data. Clicking the "show email list" button will give you a de-duplicated set of email addreses.</p>
        <ul>
            <li>
                 <router-link :to="{ name: 'group', params: { groupId: 20 } }">All members of the CLA Administrators' Forum (department administrators for academic and non-academic units)</router-link> (users who are members of the Admin Forum group)</li>
            <li><router-link :to="{ name: 'role', params: { roleId: 22 } }">All members of Council of Chairs (all faculty leaders for the 31 academic departments)</router-link> (all users with "Academic Chair" role)</li>
            <li>All CLA center directors (users with the role "director" in a group of type "center"</li>
            <li>All members of the CLA Executive Committee (tbd)</li>
            <li>All Dean's Group members (tbd)</li>
            <li><router-link :to="{ name: 'group', params: { groupId: 83 } }">All OLT members</router-link></li>
            <li>And a list of other misc people (tbd)</li>
        </ul>
        <members :members="groupList" :editing="false" :roles="[]" :show_unit="true" groupType="list" viewType="role" downloadTitle="CEDD Like"/>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                groupList: []
            }
        },
        async mounted() {
            var adminGroup = await axios.get("/api/group/20")
            axios.get("/api/group/20/members")
                .then(res => {
                    this.groupList = res.data.map(g => {
                        g.group = adminGroup.data;
                        return g;
                    });
                });

            var oltGroup = await axios.get("/api/group/83")
            axios.get("/api/group/83/members")
                .then(res => {
                    this.groupList = res.data.map(g => {
                        g.group = oltGroup.data;
                        return g;
                    });
                });
            
            // var adminGroup = await axios.get("/api/role/22")
            axios.get("/api/role/22")
                .then(res => {
                    this.groupList = [...this.groupList, ... res.data.members];
                })

            // var adminGroup = await axios.get("/api/role/22")
            axios.get("/api/role/40")
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
