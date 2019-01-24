<template>
    <div>
        <div class="row">
          <div class="col-md-12">
            <button class="btn btn-outline-primary float-right" @click="$emit('update:editing', true)" v-if="group.user_can_edit">Edit Group</button>
            <h1>{{ group.group_title }}</h1>
            <ul class="groupInfo">
                <li v-if="group.parent_organization">Parent Organization: <strong>{{ group.parent_organization.group_title }}</strong></li>
                <li v-if="group.group_type">Group Type: <strong>{{ group.group_type.group_type }}</strong></li>
                <li v-if="group.google_group">Google Group: <strong>{{ group.google_group }}</strong></li>
                <li>{{group.notes}}</li>
            </ul>
        </div>
    </div>
    <p v-if="group.private_group"><strong>Private Group</strong></p>
    
    <ul>
        <li v-for="artifact in group.artifacts"><a v-bind:href="artifact.target">{{ artifact.label }}</a></li>
    </ul>
    <button class="btn btn-success" @click="showEmailList = !showEmailList">Show Email List</button>
    <members :members="group.members" ></members>
    
    <modal :show="showEmailList" @close="showEmailList = !showEmailList">
        <div class="row">
            <div class="col-md-12">
                <p>Email list:</p>
                <textarea class="form-control" @click="$event.target.select()" :value=emailList rows=10></textarea>
            </div>
        </div>
    </modal>
     <router-link :to="{'name':'userList', query:{'groupId':this.group.id}}" class="btn btn-outline-secondary">View membership counts</router-link>
</div>
</template>

<script>
export default {
    props: ['group', 'editing'],
    data() {
        return {
            showEmailList: false
        }
    },
    mounted() {
    },
    methods: {

    },
    computed: {
        emailList: function() {
            // return a list of email addresses of users that are currently active, de-duplicated and with null values removed
            return this.group.members.map(function(elem, index) {
                    return (elem.end_date == null)?elem.user.email:null;
            }).filter(x => x).filter((elem, pos, arr) => {return arr.indexOf(elem) == pos;}).join(", ");
        }
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