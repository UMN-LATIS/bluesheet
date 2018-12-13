<template>
    <div>
        <table class="table">
            <thead>
                <tr>
                    <th scope="col">Group Name</th>
              </tr>
          </thead>
          <tbody>
            <tr v-for="(group, key) in sortedGroupList" v-if="groupList">
                <td><router-link :to="{ name: 'group', params: { groupId: group.id } }">{{ group.group_title }}</router-link></td>
                
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
                error: null
            }
        },
        mounted() {
            this.loadGroups();
        },
        computed: {
            sortedGroupList: function() {
                return _.sortBy(this.groupList, [group => group.group_title.toLowerCase()]);
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
