<template>
    <div>
        <p>This list combines the following data. Clicking the "show email list" button will give you a de-duplicated
            set of email addresses.</p>
        <ul>
            <li>
                <router-link :to="{ name: 'role', params: { roleId: 23 } }">All department administrators for academic
                    units and graduate minors
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
            groupsToLoad: [2, 4, 19, 25,28, 108, 157,1]
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



    },
    computed: {

    },
    methods: {

    }
}

</script>
