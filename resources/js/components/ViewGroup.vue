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
                <li v-if="group.child_groups.length > 0">Sub Groups: <ul v-if="group.child_groups">
                    <li v-for="child_group in group.child_groups">
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
    <template v-if="userperms > 0">

    <button class="btn btn-success" @click="showEmailList = !showEmailList">Show Email List</button>
    <download-csv  class="btn btn-info" :data="csvlist">Download List</download-csv>
    <button class="btn btn-primary" v-bind:class="{ active: filterList }" aria-pressed="false" @click="filterList =! filterList" >Filter List</button>
    </template>
    <members :members.sync="group.members" :filterList="filterList" :editing="false" :show_unit="group.show_unit" :userperms='userperms'></members>
    
    
    
    <modal :show="showEmailList" @close="showEmailList = !showEmailList">
        <div class="row">
            <div class="col-md-12">
                <p>Email list:</p>
                <textarea class="form-control" @click="$event.target.select()" :value=emailList rows=10></textarea>
            </div>
        </div>
    </modal>
     <router-link v-if="userperms>0" :to="{'name':'userList', query:{'groupId':this.group.id}}" class="btn btn-outline-secondary">View membership counts</router-link>
</div>
</template>

<script>
export default {
    props: ['group', 'editing', 'userperms'],
    data() {
        return {
            showEmailList: false,
            filterList: false
        }
    },
    mounted() {
    },
    computed: {
        emailList: function() {
            var targetList = this.group.members;
            if(this.filterList) {
                targetList = this.group.members.filter(e => e.filtered);
            }
            // return a list of email addresses of users that are currently active, de-duplicated and with null values removed
            return targetList.map(function(elem, index) {
                    return (elem.end_date == null)?elem.user.email:null;
            }).filter(x => x).filter((elem, pos, arr) => {return arr.indexOf(elem) == pos;}).join(", ");
        },
        csvlist: function() {
            var targetList = this.group.members;
            if(this.filterList) {
                targetList = this.group.members.filter(e => e.filtered);
            }
            const rows = targetList.map(r => {
                return {
                "surname": r.user.surname,
                "given name": r.user.givenname,
                "email": r.user.email,
                "role": r.role.label,
                "notes": r.notes,
                "start date": r.start_date,
                "end date": r.end_date
                }
            });
            return rows;
            // let row_str = 'Surname, GivenName, Label, Notes, Start Date, End Date\n'
            // row_str += rows.join('\n');
            
            // console.log(row_str);

            // const link = document.createElement("a");
            // const file = new Blob([row_str], {type: 'text/csv'});
            // link.href = URL.createObjectURL(file);
            // link.download = '' + this.group.group_title + '.csv';
            // link.click();
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