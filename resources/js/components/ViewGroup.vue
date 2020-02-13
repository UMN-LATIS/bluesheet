<template>
    <div>
        <div class="row">
          <div class="col-md-12">
            <button class="btn btn-outline-primary float-right" @click="$emit('update:editing', true)" v-if="group.user_can_edit">Edit Group</button>
            <h1>{{ group.group_title }}</h1>
            <ul class="groupInfo">
                <li v-if="group.parent_organization">Parent Organization: <strong>{{ group.parent_organization.group_title }}</strong></li>
                <li v-if="group.parent_group">Parent Group: <strong><router-link :to="{'name':'group', params: { groupId: group.parent_group.id }}">{{ group.parent_group.group_title }}</router-link></strong></li>
                <li v-if="group.group_type">Group Type: <strong>{{ group.group_type.label }}</strong></li>
                <li v-if="group.google_group">Google Group: <strong>{{ group.google_group }}</strong></li>
                <li v-if="group.private_group"><strong>Private Group</strong></li>
                <li>{{group.notes}}</li>
                <li v-if="group.child_groups.filter(e=>e.active_group).length > 0">Sub Groups: <ul v-if="group.child_groups">
                    <li v-for="child_group in group.child_groups.filter(e=>e.active_group)">
                        <router-link :to="{'name':'group', params: { groupId: child_group.id }}">{{ child_group.group_title }}</router-link>
                    </li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
    
    
    <ul>
        <li v-for="artifact in group.artifacts"><a v-bind:href="artifact.target">{{ artifact.label }}</a></li>
    </ul>

    <members :groupType="group.group_type.label" :members.sync="group.members" :editing="false" :show_unit="group.show_unit" :userperms='userperms' :roles='roles' viewType="group"></members>
    

 
     <router-link v-if="userperms>0" :to="{'name':'userList', query:{'groupId':this.group.id}}" class="btn btn-outline-secondary">View membership counts</router-link>
</div>
</template>

<script>
export default {
    props: ['group', 'editing', 'userperms'],
    data() {
        return {
            roles: []
        }
    },
    mounted() {
        axios.get("/api/group/roles/")
        .then(res => {
        this.roles = res.data;
      })
      .catch(err => {
        this.error = err.response.data;
      });
    },
    computed: {
        
    }
}
</script>

<style scoped>
.row {
  margin-top: 10px;
  margin-bottom: 10px;
}

.groupInfo {
    list-style: none;
}
</style>