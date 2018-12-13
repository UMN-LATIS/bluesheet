<template>
    <div>
        <div class="form-check float-right" v-if="!editing">
          <input class="form-check-input" type="checkbox" v-model="includePreviousMembers" id="pastMembers">
          <label class="form-check-label" for="pastMembers">
            Include Previous Members
        </label>
    </div>
    <table class="table">
        <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">From</th>
              <th scope="col" v-if="includePreviousMembers">Until</th>
              <th scope="col" v-if="editing">Group Admin</th>
              <th scope="col" v-if="editing">Remove</th>
          </tr>
      </thead>
      <tbody>
        <tr v-for="(member, key) in filteredList">
            <td><router-link :to="{ name: 'user', params: { userId: member.user.id } }" v-if="member.user.id">{{ member.user.displayName }}</router-link>
            <span v-if="!member.user.id">{{ member.user.displayName }}</span>
            </td>
            <td v-if="!editing">{{ member.role.label }}</td>
            <td v-if="editing"><v-select taggable v-model="member.role" :options="roles"></v-select></td>
            <td>{{ member.start_date | moment("YYYY, MMM Do") }}</td>
            <td v-if="includePreviousMembers">{{ member.end_date  | moment("YYYY, MMM Do") }}</td>
            <td v-if="editing"><input class="form-check-input" type="checkbox" v-model="member.admin"></td>
            <td v-if="editing"><button class="btn btn-danger" @click="removeMember(member, key)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>
    </tbody>
  </table>
</div>
</template>

<script>
export default {
    props: ['members', 'editing'],
    data() {
        return {
            includePreviousMembers: false,
            roles: [],
        }
    },
    mounted() {
        if(this.editing) {
            axios.get("/api/group/roles/")
            .then(res => {
                this.roles = res.data;
            })
            .catch(err => {
                this.error = err.response.data;
            });
        }
    },
    computed: {
        filteredList: function() {
            return this.sortedList.filter(function(role) {
                if(role.end_date == null || this.includePreviousMembers) {
                    return role;
                }

            }.bind(this));
        },
        sortedList: function() {
            return this.members.sort(function (a, b) {
                return this.$moment(b.start_date).utc().diff(this.$moment(a.start_date).utc());
            }.bind(this));
        }
    },
    methods: {
        removeMember: function(removeMember, index) {
            if(!removeMember.id) {
                // this was an accidental record, just split it
                this.$emit("update:members", this.members.filter(member => removeMember !== member));
            }
            else {
                removeMember.end_date = this.$moment().format("YYYY-MM-DD hh:mm:ss");    
            }
            
        }
    }
}
</script>


<style>

.v-select {
    background-color: white;
}
.v-select.dropdown .dropdown-toggle::after {
content: normal;
}
.v-select.dropdown .form-control {
height: normal;
}

</style>

