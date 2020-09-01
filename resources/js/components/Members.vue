<template>
    <div>
        <template v-if="$can('view groups') && !editing">
            <button class="btn btn-success" @click="showEmailList = !showEmailList">Show Email List</button>
            <download-csv class="btn btn-info" :data="csvlist" :name="downloadTitle + '.csv'">Download List</download-csv>
            <button class="btn btn-primary" v-bind:class="{ active: filterList }" aria-pressed="false"
                @click="filterList =! filterList">Filter List</button>
        </template>
        <modal :show="showEmailList" @close="showEmailList = !showEmailList">
            <div class="row">
                <div class="col-md-12">
                    <p>Email list:</p>
                    <textarea class="form-control" @click="$event.target.select()" :value=emailList rows=10></textarea>
                </div>
            </div>
        </modal>

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
                    <input v-model="searchValue" class="searchBox" ref="searchbox" v-if="showSearch"
                        placeholder="Search">
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
                    <th scope="col" v-if="filterList" width=5%>Filter</th>
                    <th scope="col">
                        <sortableLink sortLabel="Name" sortElement="user.surname" :currentSort="currentSort"
                            :currentSortDir="currentSortDir" v-on:sort="sort" />
                    </th>
                    <th v-if="show_unit && !showGantt && viewType == 'group'" scope="col">
                        <sortableLink sortLabel="Unit" sortElement="user.ou" :currentSort="currentSort"
                            :currentSortDir="currentSortDir" v-on:sort="sort" />
                    </th>
                    <th v-if="!showGantt &&  viewType == 'group'" scope="col">
                        <sortableLink sortLabel="Role" sortElement="role.label" :currentSort="currentSort"
                            :currentSortDir="currentSortDir" v-on:sort="sort" />
                    </th>

                    <th v-if="!showGantt && viewType == 'role'" scope="col">
                        <sortableLink sortLabel="Group" sortElement="group.group_title" :currentSort="currentSort"
                            :currentSortDir="currentSortDir" v-on:sort="sort" />
                    </th>


                    <th v-if="!showGantt" scope="col">
                        <sortableLink sortLabel="Notes" sortElement="notes" :currentSort="currentSort"
                            :currentSortDir="currentSortDir" v-on:sort="sort" />
                    </th>

                    <th v-if="!showGantt" scope="col">
                        <sortableLink sortLabel="From" sortElement="start_date" :currentSort="currentSort"
                            :currentSortDir="currentSortDir" v-on:sort="sort" />
                    </th>

                    <th scope="col" v-if="!showGantt && (includePreviousMembers || editing)">
                        <sortableLink sortLabel="Until" sortElement="end_date" :currentSort="currentSort"
                            :currentSortDir="currentSortDir" v-on:sort="sort" />
                    </th>
                    <th scope="col" width=11% v-if="!showGantt && !editing &&  viewType == 'group'">
                        <sortableLink sortLabel="Official Role" sortElement="role.official_department_role"
                            :currentSort="currentSort" :currentSortDir="currentSortDir" v-on:sort="sort" />
                    </th>
                    <th scope="col" v-if="editing && !showGantt">Group Admin</th>
                    <th scope="col" v-if="editing && !showGantt">End Active Membership</th>
                </tr>
            </thead>
            <member-list v-if="!showGantt" v-on:remove="removeMember" :show_unit="show_unit" :roles="filteredRoles"
                :editing="editing" :filteredList="filteredList" :filterList="filterList"
                :includePreviousMembers="includePreviousMembers"  :viewType="viewType">
            </member-list>
            <gantt v-if="showGantt" :members="filteredList" :filterList="filterList" :mindate="lowestValue"
                :maxdate="highestValue" :show_unit="show_unit"></gantt>
        </table>
        <div class="card mt-3 mb-3 col-sm-6" v-if="isDepartment && unfilledRoles.length > 0 && editing">
            <div class="card-body">
                <h4 class="card-title">Unassigned Official Roles</h4>
                <p class="card-text">This department currently does not have people assigned to these official roles</p>
            </div>
                <ul class="nav nav-tabs" id="myTab" role="tablist">
                    <li class="nav-item"  v-for="(officialCategory, index) in officialRoleCategories" :key="index">
                        <a class="nav-link" :class="{ 'active': index === 0 }" :id="officialCategory + '-tab'" data-toggle="tab" :href="'#' + officialCategory" role="tab"
                            aria-controls="home" aria-selected="true">{{ officialCategory }} <span class="badge badge-secondary">{{ rolesForOfficialCategory(officialCategory).length }}</span></a>
                    </li>
                </ul>
                <div class="tab-content" id="myTabContent">
                    
                    <div v-for="(officialCategory, index) in officialRoleCategories" :key="index" class="tab-pane fade" :id="officialCategory" role="tabpanel" aria-labelledby="officialCategory + '-tab'" :class="{ 'show active': index === 0 }">
                        <ul class="list-group list-group-flush">
                                <li class="list-group-item" v-for="officialRole in rolesForOfficialCategory(officialCategory)" :key="officialRole.id">
                                {{ officialRole.label }}</li>
                        </ul>

                    </div>
                </div>
                
        </div>

    </div>
</template>

<script>
    export default {
        props: ['members', 'editing', 'roles', 'show_unit', 'groupType', 'viewType', "downloadTitle"],
        data() {
            return {
                includePreviousMembers: false,
                currentSortDir: 'asc',
                currentSort: 'user.surname',
                showSearch: false,
                searchValue: null,
                showGantt: false,
                showEmailList: false,
                filterList: false,
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
            officialRoles: function () {
                return this.roles ? this.roles.filter(r => r.official_department_role == 1) : [];
            },
            officialRoleCategories: function () {
                var allOfficialRoles = this.officialRoles ? this.officialRoles.map(r => r.official_role_category.category)
                 : [];
                return [...new Set(allOfficialRoles)];
            },
            filteredRoles: function () {
                if(!this.roles) {
                    return [];
                }
                return this.isDepartment ? this.roles : this.roles.filter(r => r.official_department_role == 0);
            },
            unfilledRoles: function () {
                return this.officialRoles.filter(r => !this.filteredList.map(m => m.role?m.role.id:null).includes(r.id));
            },
            isDepartment: function () {
                return this.groupType == 'Department';
            },
            lowestValue: function () {
                if (this.filteredList.length > 0) {
                    return this.filteredList.map(m => this.$moment(m.start_date).unix()).reduce((a, b) => Math.min(
                        a, b))
                }
            },
            highestValue: function () {
                var maxDate = null;
                if (this.filteredList.length > 0) {
                    maxDate = this.filteredList.map(m => this.$moment(m.end_date ? m.end_date : this.$moment())
                        .unix()).reduce((a, b) => Math.max(
                        a, b))
                }
                return maxDate;

            },
            filteredList: function () {
                return this.sortedList.filter(function (membership) {
                    if (this.includePreviousMembers || membership.end_date == null || this.$moment(
                            membership.end_date).isAfter(this.$moment())) {
                        var searchTerm = null;
                        if (this.searchValue) {
                            var searchTerm = this.searchValue.toLowerCase();
                        }

                        if (searchTerm === null || (membership.user.displayName.toLowerCase().includes(
                                    searchTerm) || membership.user.email.includes(searchTerm) || membership
                                .role.label.toLowerCase().includes(searchTerm) || membership.user.ou
                                .toLowerCase().includes(searchTerm))) {
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
            },
            emailList: function () {
                var targetList = this.members;
                if (this.filterList) {
                    targetList = this.members.filter(e => e.filtered);
                }

                // return a list of email addresses of users that are currently active, de-duplicated and with null values removed
                return targetList.map((elem, index) =>
                    (elem.end_date == null || this.$moment(elem.end_date).isAfter(this.$moment())) ? elem.user
                    .email : null
                ).filter(x => x).filter((elem, pos, arr) => {
                    return arr.indexOf(elem) == pos;
                }).join(", ");
            },
            csvlist: function () {
                var targetList = this.members;
                if (this.filterList) {
                    targetList = this.members.filter(e => e.filtered);
                }
                const rows = targetList.map(r => {
                    return {
                        "surname": r.user.surname,
                        "given name": r.user.givenname,
                        "email": r.user.email,
                        "role": r.role.label,
                        "notes": r.notes,
                        "start date": r.start_date,
                        "end date": r.end_date,
                        "office": r.user.office.replace(/ \$ /g, "\n"),
                        "title": r.user.title
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
        },
        methods: {
            rolesForOfficialCategory: function(category) {
                return this.unfilledRoles.filter(r => r.official_role_category.category == category);
            },
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
                    if (removeMember.end_date) {
                        if (confirm("Are you sure you wish remove all record of this user within this group?")) {
                            this.$emit("update:members", this.members.filter(member => removeMember !== member));
                        }
                    } else {
                        removeMember.end_date = this.$moment().format("YYYY-MM-DD hh:mm:ss");
                    }


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
