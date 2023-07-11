<template>
  <div>
    <template v-if="$can('view groups') && !editing">
      <button class="btn btn-success" @click="showEmailList = !showEmailList">
        Show Email List
      </button>
      <DownloadCSV
        class="btn btn-info"
        :data="csvlist"
        :name="downloadTitle + '.csv'"
        >Download List</DownloadCSV
      >
      <button
        class="btn btn-primary"
        v-bind:class="{ active: filterList }"
        aria-pressed="false"
        @click="filterList = !filterList"
      >
        Filter List
      </button>
    </template>
    <modal :show="showEmailList" @close="showEmailList = !showEmailList">
      <div class="row">
        <div class="col-md-12">
          <p>Email list:</p>
          <textarea
            class="form-control"
            @click="$event.target.select()"
            :value="emailList"
            rows="10"
          ></textarea>
        </div>
      </div>
    </modal>

    <div class="row controlRow">
      <div class="col">
        <div class="form-check float-right checkContainer">
          <input
            class="form-check-input"
            type="checkbox"
            v-model="includePreviousMembers"
            id="pastMembers"
          />
          <label class="form-check-label" for="pastMembers">
            Include Previous Members
          </label>
        </div>
      </div>
    </div>
    <div class="row controlRow">
      <div class="col">
        <div class="search-container" v-bind:class="{ expandBox: showSearch }">
          <input
            v-model="searchValue"
            class="searchBox"
            ref="searchbox"
            v-if="showSearch"
            placeholder="Search"
          />
          <a class="button" @click="showSearch = !showSearch">
            <i class="searchIcon fa fa-search"></i>
          </a>
        </div>
      </div>
      <div class="col">
        <div class="btn-group btn-group-toggle float-right">
          <label
            class="btn btn-outline-secondary"
            v-bind:class="{ active: !showGantt }"
          >
            <input
              type="radio"
              name="viewOptions"
              v-model="showGantt"
              :value="false"
            />List
          </label>
          <label
            class="btn btn-outline-secondary"
            v-bind:class="{ active: showGantt }"
          >
            <input
              type="radio"
              name="viewOptions"
              v-model="showGantt"
              :value="true"
            />Chart
          </label>
        </div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th scope="col" v-if="filterList" width="5%">Filter</th>
          <th scope="col">
            <sortableLink
              sortLabel="Name"
              sortElement="user.surname"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              v-on:sort="sort"
            />
          </th>
          <th v-if="show_unit && !showGantt && viewType == 'group'" scope="col">
            <sortableLink
              sortLabel="Unit"
              sortElement="user.ou"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              v-on:sort="sort"
            />
          </th>
          <th v-if="!showGantt && viewType == 'group'" scope="col">
            <sortableLink
              sortLabel="Role"
              sortElement="role.label"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              v-on:sort="sort"
            />
          </th>

          <th v-if="!showGantt && viewType == 'role'" scope="col">
            <sortableLink
              sortLabel="Group"
              sortElement="group.group_title"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              v-on:sort="sort"
            />
          </th>

          <th v-if="!showGantt" scope="col">
            <sortableLink
              sortLabel="Notes"
              sortElement="notes"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              v-on:sort="sort"
            />
          </th>

          <th v-if="!showGantt" scope="col">
            <sortableLink
              sortLabel="From"
              sortElement="start_date"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              v-on:sort="sort"
            />
          </th>

          <th
            scope="col"
            v-if="!showGantt && (includePreviousMembers || editing)"
          >
            <sortableLink
              sortLabel="Until"
              sortElement="end_date"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              v-on:sort="sort"
            />
          </th>
          <th
            scope="col"
            width="11%"
            v-if="!showGantt && !editing && viewType == 'group'"
          >
            <sortableLink
              sortLabel="Official Role"
              sortElement="role.official_group_type"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              v-on:sort="sort"
            />
          </th>
          <th scope="col" v-if="editing && !showGantt">Group Admin</th>
          <th scope="col" v-if="editing && !showGantt">
            End Active Membership
          </th>
        </tr>
      </thead>
      <member-list
        v-if="!showGantt"
        v-on:remove="removeMember"
        :show_unit="show_unit"
        :roles="roles"
        :editing="editing"
        :filteredList="filteredList"
        :filterList="filterList"
        :includePreviousMembers="includePreviousMembers"
        :viewType="viewType"
      >
      </member-list>
      <gantt
        v-if="showGantt"
        :members="filteredList"
        :filterList="filterList"
        :mindate="lowestValue"
        :maxdate="highestValue"
        :show_unit="show_unit"
        @update:member="handleUpdateMember"
      ></gantt>
    </table>
    <div
      class="card mt-3 mb-3 col-sm-6"
      v-if="officialRoles.length > 0 && unfilledRoles.length > 0 && editing"
    >
      <div class="card-body">
        <h4 class="card-title">Unassigned Official Roles</h4>
        <p class="card-text">
          This {{ groupType.toLowerCase() }} currently does not have people
          assigned to these official roles
        </p>
      </div>
      <ul class="nav nav-tabs" id="myTab" role="tablist">
        <li
          class="nav-item"
          v-for="(officialCategory, index) in officialRoleCategories"
          :key="index"
        >
          <a
            class="nav-link"
            :class="{ active: index === 0 }"
            :id="officialCategory + '-tab'"
            data-toggle="tab"
            :href="'#' + officialCategory"
            role="tab"
            aria-controls="home"
            aria-selected="true"
            >{{ officialCategory }}
            <span class="badge badge-secondary">{{
              rolesForOfficialCategory(officialCategory).length
            }}</span></a
          >
        </li>
      </ul>
      <div class="tab-content" id="myTabContent">
        <div
          v-for="(officialCategory, index) in officialRoleCategories"
          :key="index"
          class="tab-pane fade"
          :id="officialCategory"
          role="tabpanel"
          aria-labelledby="officialCategory + '-tab'"
          :class="{ 'show active': index === 0 }"
        >
          <ul class="list-group list-group-flush">
            <li
              class="list-group-item"
              v-for="officialRole in rolesForOfficialCategory(officialCategory)"
              :key="officialRole.id"
            >
              {{ officialRole.label }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SortableLink from "./SortableLink.vue";
import DownloadCSV from "vue-json-csv";
import MemberList from "./MemberList.vue";
import Gantt from "./Gantt.vue";
import Modal from "./Modal.vue";

export default {
  props: [
    "members",
    "editing",
    "roles",
    "show_unit",
    "groupType",
    "viewType",
    "downloadTitle",
  ],
  emits: ["update:members"],
  components: {
    SortableLink,
    DownloadCSV,
    MemberList,
    Gantt,
    Modal,
  },
  data() {
    return {
      includePreviousMembers: false,
      currentSortDir: "asc",
      currentSort: "user.surname",
      showSearch: false,
      searchValue: null,
      showGantt: false,
      showEmailList: false,
      filterList: false,
    };
  },
  watch: {
    showSearch: function (newVal) {
      if (newVal == true) {
        setTimeout(
          function () {
            this.$refs.searchbox.focus();
          }.bind(this),
          250,
        );
      } else {
        this.searchValue = null;
      }
    },
  },
  computed: {
    officialRoles: function () {
      return this.roles.filter((r) =>
        r.official_group_type
          ? r.official_group_type.map((gt) => gt.label).includes(this.groupType)
          : false,
      );
    },
    officialRoleCategories: function () {
      var allOfficialRoles = this.officialRoles
        ? this.officialRoles.map((r) => r.official_role_category.category)
        : [];
      return [...new Set(allOfficialRoles)];
    },
    unfilledRoles: function () {
      return this.officialRoles.filter(
        (r) =>
          !this.filteredList
            .map((m) => (m.role ? m.role.id : null))
            .includes(r.id),
      );
    },
    lowestValue: function () {
      if (this.filteredList.length > 0) {
        return this.filteredList
          .map((m) => this.$moment(m.start_date).unix())
          .reduce((a, b) => Math.min(a, b));
      }
      return 0;
    },
    highestValue: function () {
      var maxDate = null;
      if (this.filteredList.length > 0) {
        maxDate = this.filteredList
          .map((m) =>
            this.$moment(m.end_date ? m.end_date : this.$moment()).unix(),
          )
          .reduce((a, b) => Math.max(a, b));
      }
      return maxDate;
    },
    filteredList: function () {
      return this.sortedList.filter(
        function (membership) {
          if (
            this.includePreviousMembers ||
            membership.end_date == null ||
            this.$moment(membership.end_date).isAfter(this.$moment())
          ) {
            var searchTerm = null;
            if (this.searchValue) {
              searchTerm = this.searchValue.toLowerCase();
            }

            if (
              searchTerm === null ||
              membership.user.displayName.toLowerCase().includes(searchTerm) ||
              membership.user.email.includes(searchTerm) ||
              membership.role.label.toLowerCase().includes(searchTerm) ||
              membership.user.ou.toLowerCase().includes(searchTerm)
            ) {
              return membership;
            }
          }
        }.bind(this),
      );
    },
    sortedList: function () {
      return [...this.members].sort(
        function (a, b) {
          let modifier = 1;
          if (this.currentSortDir === "desc") modifier = -1;

          const aCurrentSort = window._.get(a, this.currentSort) || " ";
          const bCurrentSort = window._.get(b, this.currentSort) || " ";

          if (aCurrentSort < bCurrentSort) return -1 * modifier;
          if (aCurrentSort > bCurrentSort) return 1 * modifier;
          return 0;
        }.bind(this),
      );
    },
    emailList: function () {
      let targetList = this.filteredList;

      if (this.filterList) {
        targetList = targetList.filter((e) => e.filtered);
      }

      // return a list of email addresses of users that are currently active, de-duplicated and with null values removed
      return targetList
        .map((elem) =>
          elem.end_date == null ||
          this.$moment(elem.end_date).isAfter(this.$moment())
            ? elem.user.email
            : null,
        )
        .filter((x) => x)
        .filter((elem, pos, arr) => {
          return arr.indexOf(elem) == pos;
        })
        .join(", ");
    },
    csvlist() {
      let targetList = this.filteredList;

      if (this.filterList) {
        targetList = targetList.filter((e) => e.filtered);
      }
      return targetList.map((member) => {
        let userRow = {};
        if (this.viewType == "role") {
          userRow["group title"] = member.group.group_title;
          userRow["group abbr"] = member.group.abbreviation;
          userRow[
            "link"
          ] = `${window.location.origin}/groups/${member.group.id}`;
        }
        userRow = {
          ...userRow,
          role: member.role.label,
          surname: member.user.surname,
          "given name": member.user.givenname,
          email: member.user.email,
          title: member.user.title,
          notes: member.notes,
          office: member.user.office
            ? member.user.office.replace(/ \$ /g, "\n")
            : "",
          unit: member.user.ou,
          start_date: member.start_date,
          end_date: member.end_date,
        };
        return userRow;
      });
    },
  },
  methods: {
    handleUpdateMember(updatedMember) {
      this.$emit(
        "update:members",
        this.members.map((member) => {
          if (member.id == updatedMember.id) {
            return updatedMember;
          }
          return member;
        }),
      );
    },

    rolesForOfficialCategory: function (category) {
      return this.unfilledRoles.filter(
        (r) => r.official_role_category.category == category,
      );
    },
    sort: function (s) {
      //if s == current sort, reverse
      if (s === this.currentSort) {
        this.currentSortDir = this.currentSortDir === "asc" ? "desc" : "asc";
      } else {
        this.currentSortDir = "asc";
      }
      this.currentSort = s;
    },
    removeMember: function (removeMember) {
      if (!removeMember.id) {
        // this was an accidental record, just split it
        this.$emit(
          "update:members",
          this.members.filter((member) => removeMember !== member),
        );
      } else {
        if (removeMember.end_date) {
          if (
            confirm(
              "Are you sure you wish remove all record of this user within this group?",
            )
          ) {
            this.$emit(
              "update:members",
              this.members.filter((member) => removeMember !== member),
            );
          }
        } else {
          removeMember.end_date = this.$moment().format("YYYY-MM-DD hh:mm:ss");
        }
      }
    },
  },
};
</script>

<style>
.sortableLink {
  cursor: pointer;
}

.search-container {
  float: left !important;
  transition:
    all 0.35s,
    border-radius 0s;
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
