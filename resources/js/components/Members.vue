<template>
    <div>   
<div class="row controlRow">
    <div class="col">
        <div class="search-container" v-bind:class="{ expandBox: showSearch  }" v-if="!editing">
            <input v-model="searchValue" class="searchBox" ref="searchbox"  v-if="showSearch"  placeholder="Search">
            <a class=" button" @click="showSearch = !showSearch" >
            <i class="searchIcon fa fa-search"></i>
        </a>
        </div>
    </div>
    <div class="col">
        <div class="form-check float-right checkContainer" v-if="!editing">
          <input class="form-check-input" type="checkbox" v-model="includePreviousMembers" id="pastMembers">
          <label class="form-check-label" for="pastMembers">
            Include Previous Members
        </label>
    </div>
    </div>
</div>

    <table class="table">
        <thead>
            <tr>
              <th scope="col"><span @click="sort('user.surname')" class="sortableLink">Name <i class="fas" v-bind:class="{ 'fa-sort-alpha-up': currentSortDir == 'desc' && currentSort == 'user.surname', 'fa-sort-alpha-down': currentSortDir == 'asc' && currentSort == 'user.surname'}" ></i></span></th>
              <th scope="col"><span @click="sort('role.label')" class="sortableLink">Role <i class="fas" v-bind:class="{ 'fa-sort-alpha-up': currentSortDir == 'desc' && currentSort == 'role.label', 'fa-sort-alpha-down': currentSortDir == 'asc' && currentSort == 'role.label'}" ></i></span></th>
              <th scope="col">Notes</th>
              <th scope="col"><span @click="sort('start_date')" class="sortableLink">From <i class="fas" v-bind:class="{ 'fa-sort-amount-up': currentSortDir == 'asc' && currentSort == 'start_date', 'fa-sort-amount-down': currentSortDir == 'desc' && currentSort == 'start_date'}" ></i></span></th>
              <th scope="col" v-if="includePreviousMembers"><span @click="sort('end_date')" class="sortableLink">Until <i class="fas" v-bind:class="{ 'fa-sort-amount-up': currentSortDir == 'asc' && currentSort == 'end_date', 'fa-sort-amount-down': currentSortDir == 'desc' && currentSort == 'end_date'}" ></i></span></th>
              <th scope="col" v-if="editing">Group Admin</th>
              <th scope="col" v-if="editing">Remove</th>
          </tr>
      </thead>
      <tbody>
        <tr v-for="(member, key) in filteredList">
            <td>
              <router-link :to="{ name: 'user', params: { userId: member.user.id } }" v-if="member.user.id">
                {{ member.user.surname }}, {{ member.user.givenname }}
              </router-link>
              <span v-if="!member.user.id">{{ member.user.surname }}, {{ member.user.givenname }}</span>
            </td>
            <td v-if="!editing">{{ member.role.label }}</td>
            <td v-if="editing"><v-select taggable v-model="member.role" :options="roles" v-if="roles"></v-select></td>
            
            <td v-if="!editing">{{ member.notes }}</td>
            <td v-if="editing"><input class="form-control" v-model="member.notes"></textarea></td>
            
            <td>{{ member.start_date | moment("YYYY, MMM Do") }}</td>
            <td v-if="includePreviousMembers"><span v-if="member.end_date">{{ member.end_date  | moment("YYYY, MMM Do") }}</span></td>
            <td v-if="editing"><input class="form-check-input" type="checkbox" v-model="member.admin"></td>
            <td v-if="editing"><button class="btn btn-danger" @click="removeMember(member, key)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>
    </tbody>
</table>
</div>
</template>

<script>
    export default {
        props: ['members', 'editing', 'roles'],
        data() {
            return {
                includePreviousMembers: false,
                currentSortDir: 'desc',
                currentSort: 'start_date',
                showSearch: false,
                searchValue: null
            }
        },
        watch: {
            showSearch: function(newVal, oldVal) {
                if(newVal == true) {
                    setTimeout(function () { this.$refs.searchbox.focus() }.bind(this), 250)

                }
                else {
                    this.searchValue = null;
                }
            },
        },
        computed: {
            filteredList: function() {
                return this.sortedList.filter(function(role) {
                    if(role.end_date == null || this.includePreviousMembers) {
                        if(this.searchValue === null || (role.user.displayName.toLowerCase().includes(this.searchValue.toLowerCase()) || role.user.email.includes(this.searchValue.toLowerCase()) || role.role.label.toLowerCase().includes(this.searchValue.toLowerCase()))) {
                            return role;    
                        }
                        
                    }

                }.bind(this));
            },
            sortedList: function() {
                return this.members.sort(function (a, b) {
                    let modifier = 1;
                    if(this.currentSortDir === 'desc') modifier = -1;

                    var a = window._.get(a, this.currentSort) || " ";
                    var b = window._.get(b, this.currentSort) || " ";

                    if(a < b) return -1 * modifier;
                    if(a > b) return 1 * modifier;
                    return 0;
                }.bind(this));
            }
        },
        methods: {
            sort:function(s) {
            //if s == current sort, reverse
            if(s === this.currentSort) {
                this.currentSortDir = this.currentSortDir==='asc'?'desc':'asc';
            }
            else {
                this.currentSortDir = 'asc';
            }
            this.currentSort = s;
        },
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
    height: 2em;
}

.sortableLink {
    cursor: pointer;
}

.search-container {
  float: left !important;
  transition: all 0.35s, border-radius 0s;
  width: 32px;
  height: 32px;
  background-color: #fff;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.075) inset;
  border-radius: 25px;
  border: 1px solid #ccc;
  overflow:hidden;
}
.expandBox {
    width: 220px;
}
.searchBox {
  margin-top: 5px;
  margin-left: 34px;
  border: 0 none;
  background: transparent;
  box-shadow: none;
  display:block;
  outline: none;
}

.checkContainer {
    padding-top: 10px;
}
.searchIcon {
  position: absolute;
  top: -1px;
    
  z-index: 2;
  display: block;
  width: 31px;
  height: 33px;
  line-height: 34px;
  text-align: center;
  color: #3596e0;
  left: initial;
  font-size: 14px;
}

.controlRow {
    padding-top: 10px;
    padding-bottom: 10px;
}


</style>
