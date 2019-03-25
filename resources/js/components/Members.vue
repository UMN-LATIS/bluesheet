<template>
    <div>
        <div class="row controlRow">

            <div class="col">
                <div class="form-check float-right checkContainer">
                    <input class="form-check-input" type="checkbox" v-model="includePreviousMembers" id="pastMembers">
                    <label class="form-check-label" for="pastMembers">
                        Include Previous Members
                    </label>
                </div>
            </div>
        </div>
        <div class="row controlRow">
            <div class="col">
                <div class="search-container" v-bind:class="{ expandBox: showSearch  }">
                    <input v-model="searchValue" class="searchBox" ref="searchbox" v-if="showSearch" placeholder="Search">
                    <a class=" button" @click="showSearch = !showSearch">
                        <i class="searchIcon fa fa-search"></i>
                    </a>
                </div>
            </div>
            <div class="col">
                <div class="btn-group btn-group-toggle float-right">
                    <label class="btn btn-outline-secondary" v-bind:class="{ active: !showGantt}">
                        <input type="radio" name="viewOptions" v-model="showGantt" :value="false">List
                    </label>
                    <label class="btn btn-outline-secondary" v-bind:class="{ active: showGantt}">
                        <input type="radio" name="viewOptions" v-model="showGantt" :value="true">Chart
                    </label>
                </div>
            </div>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th scope="col" v-if="filterList"  width=5%>Filter</th>
                    <th scope="col"><span @click="sort('user.surname')" class="sortableLink">Name <i class="fas"
                                v-bind:class="{ 'fa-sort-alpha-up': currentSortDir == 'desc' && currentSort == 'user.surname', 'fa-sort-alpha-down': currentSortDir == 'asc' && currentSort == 'user.surname'}"></i></span></th>
                    <th v-if="show_unit" scope="col"><span @click="sort('user.ou')" class="sortableLink">Unit <i class="fas"
                                v-bind:class="{ 'fa-sort-alpha-up': currentSortDir == 'desc' && currentSort == 'user.ou', 'fa-sort-alpha-down': currentSortDir == 'asc' && currentSort == 'user.ou'}"></i></span></th>
                    <th scope="col"><span @click="sort('role.label')" class="sortableLink">Role <i class="fas"
                                v-bind:class="{ 'fa-sort-alpha-up': currentSortDir == 'desc' && currentSort == 'role.label', 'fa-sort-alpha-down': currentSortDir == 'asc' && currentSort == 'role.label'}"></i></span></th>
                    <th scope="col"><span @click="sort('notes')" class="sortableLink">Notes<i class="fas"
                                v-bind:class="{ 'fa-sort-alpha-up': currentSortDir == 'desc' && currentSort == 'notes', 'fa-sort-alpha-down': currentSortDir == 'asc' && currentSort == 'notes'}"></i></span></th>
                    <th scope="col"><span @click="sort('start_date')" class="sortableLink">From <i class="fas"
                                v-bind:class="{ 'fa-sort-amount-up': currentSortDir == 'asc' && currentSort == 'start_date', 'fa-sort-amount-down': currentSortDir == 'desc' && currentSort == 'start_date'}"></i></span></th>
                    <th scope="col" v-if="includePreviousMembers"><span @click="sort('end_date')" class="sortableLink">Until
                            <i class="fas" v-bind:class="{ 'fa-sort-amount-up': currentSortDir == 'asc' && currentSort == 'end_date', 'fa-sort-amount-down': currentSortDir == 'desc' && currentSort == 'end_date'}"></i></span></th>
                    <th scope="col" v-if="editing">Group Admin</th>
                    <th scope="col" v-if="editing">Remove</th>
                </tr>
            </thead>
            <member-list v-if="!showGantt" v-on:remove="removeMember" :show_unit="show_unit" :roles="roles" :editing="editing" :filteredList="filteredList" :filterList="filterList" :includePreviousMembers="includePreviousMembers" :userperms='userperms'></member-list>
            <gantt v-if="showGantt" :members="filteredList" :filterList="filterList" :mindate="lowestValue" :maxdate="highestValue" :show_unit="show_unit"></gantt>
        </table>
    </div>
</template>

<script>
    export default {
        props: ['members', 'editing', 'roles', 'show_unit', 'userperms', 'filterList'],
        data() {
            return {
                includePreviousMembers: false,
                currentSortDir: 'desc',
                currentSort: 'start_date',
                showSearch: false,
                searchValue: null,
                showGantt: false
            }
        },
        watch: {
            showSearch: function (newVal, oldVal) {
                if (newVal == true) {
                    setTimeout(function () {
                        this.$refs.searchbox.focus()
                    }.bind(this), 250)

                } else {
                    this.searchValue = null;
                }
            },
        },
        computed: {
            lowestValue: function () {
                if (this.filteredList.length > 0) {
                    return this.filteredList.map(m => this.$moment(m.start_date).unix()).reduce((a, b) => Math.min(
                        a, b))
                }
            },
            highestValue: function () {
                return this.$moment().unix();
            },
            filteredList: function () {
                return this.sortedList.filter(function (membership) {
                    if (membership.end_date == null || this.includePreviousMembers) {
                        var searchTerm = null;
                        if(this.searchValue) {
                            var searchTerm = this.searchValue.toLowerCase();
                        }
                        
                        if (searchTerm === null || (membership.user.displayName.toLowerCase().includes(searchTerm) || membership.user.email.includes(searchTerm) || membership.role.label.toLowerCase().includes(searchTerm) || membership.user.ou.toLowerCase().includes(searchTerm))) {
                            return membership;
                        }

                    }

                }.bind(this));
            },
            sortedList: function () {
                return this.members.sort(function (a, b) {
                    let modifier = 1;
                    if (this.currentSortDir === 'desc') modifier = -1;

                    var a = window._.get(a, this.currentSort) || " ";
                    var b = window._.get(b, this.currentSort) || " ";

                    if (a < b) return -1 * modifier;
                    if (a > b) return 1 * modifier;
                    return 0;
                }.bind(this));
            }
        },
        methods: {
            sort: function (s) {
                //if s == current sort, reverse
                if (s === this.currentSort) {
                    this.currentSortDir = this.currentSortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this.currentSortDir = 'asc';
                }
                this.currentSort = s;
            },
            removeMember: function (removeMember, index) {
                if (!removeMember.id) {
                    // this was an accidental record, just split it
                    this.$emit("update:members", this.members.filter(member => removeMember !== member));
                } else {
                    removeMember.end_date = this.$moment().format("YYYY-MM-DD hh:mm:ss");
                }

            }
        }
    }

</script>


<style>
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
        overflow: hidden;
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
        display: block;
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
