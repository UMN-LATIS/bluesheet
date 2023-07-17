<template>
  <div>
    <div v-if="$can('view groups') && !editing" class="tw-flex tw-gap-1">
      <button class="btn btn-success" @click="showEmailList = !showEmailList">
        Show Email List
      </button>
      <DownloadCSV
        class="btn btn-info"
        :data="csvlist"
        :name="downloadTitle + '.csv'"
      >
        Download List
      </DownloadCSV>
      <button
        class="btn btn-primary"
        :class="{ active: filterList }"
        aria-pressed="false"
        @click="filterList = !filterList"
      >
        Filter List
      </button>
    </div>
    <Modal :show="showEmailList" @close="showEmailList = !showEmailList">
      <div class="row">
        <div class="col-md-12">
          <p>Email list:</p>
          <textarea
            class="form-control"
            :value="emailList"
            rows="10"
            @click="$event.target.select()"
          ></textarea>
        </div>
      </div>
    </Modal>

    <div class="row controlRow">
      <div class="col">
        <div class="form-check float-right checkContainer">
          <input
            id="pastMembers"
            v-model="includePreviousMembers"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label" for="pastMembers">
            Include Previous Members
          </label>
        </div>
      </div>
    </div>
    <div class="row controlRow">
      <div class="col">
        <div class="search-container" :class="{ expandBox: showSearch }">
          <input
            v-if="showSearch"
            ref="searchbox"
            v-model="searchValue"
            class="searchBox"
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
            :class="{ active: !showGantt }"
          >
            <input
              v-model="showGantt"
              type="radio"
              name="viewOptions"
              :value="false"
            />List
          </label>
          <label
            class="btn btn-outline-secondary"
            :class="{ active: showGantt }"
          >
            <input
              v-model="showGantt"
              type="radio"
              name="viewOptions"
              :value="true"
            />Chart
          </label>
        </div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th v-if="filterList" scope="col" width="5%">Filter</th>
          <th scope="col">
            <SortableLink
              sortLabel="Name"
              sortElement="user.surname"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th v-if="show_unit && !showGantt && viewType == 'group'" scope="col">
            <SortableLink
              sortLabel="Unit"
              sortElement="user.ou"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th v-if="!showGantt && viewType == 'group'" scope="col">
            <SortableLink
              sortLabel="Role"
              sortElement="role.label"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>

          <th v-if="!showGantt && viewType == 'role'" scope="col">
            <SortableLink
              sortLabel="Group"
              sortElement="group.group_title"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>

          <th v-if="!showGantt" scope="col">
            <SortableLink
              sortLabel="Notes"
              sortElement="notes"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>

          <th v-if="!showGantt" scope="col">
            <SortableLink
              sortLabel="From"
              sortElement="start_date"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>

          <th
            v-if="!showGantt && (includePreviousMembers || editing)"
            scope="col"
          >
            <SortableLink
              sortLabel="Until"
              sortElement="end_date"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th
            v-if="!showGantt && !editing && viewType == 'group'"
            scope="col"
            width="11%"
          >
            <SortableLink
              sortLabel="Official Role"
              sortElement="role.official_group_type"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th v-if="editing && !showGantt" scope="col">Group Admin</th>
          <th v-if="editing && !showGantt" scope="col">
            End Active Membership
          </th>
        </tr>
      </thead>
      <MemberList
        v-if="!showGantt"
        :show_unit="show_unit"
        :roles="roles"
        :editing="editing"
        :filteredList="filteredList"
        :filterList="filterList"
        :includePreviousMembers="includePreviousMembers"
        :viewType="viewType"
        @remove="removeMember"
      >
      </MemberList>
      <Gantt
        v-if="showGantt"
        :members="filteredList"
        :filterList="filterList"
        :mindate="lowestValue"
        :maxdate="highestValue"
        :show_unit="show_unit"
        @update:member="handleUpdateMember"
      ></Gantt>
    </table>
    <div
      v-if="officialRoles.length > 0 && unfilledRoles.length > 0 && editing"
      class="card mt-3 mb-3 col-sm-6"
    >
      <div class="card-body">
        <h4 class="card-title">Unassigned Official Roles</h4>
        <p class="card-text">
          This {{ groupType.toLowerCase() }} currently does not have people
          assigned to these official roles
        </p>
      </div>
      <ul id="myTab" class="nav nav-tabs" role="tablist">
        <li
          v-for="(officialCategory, index) in officialRoleCategories"
          :key="index"
          class="nav-item"
        >
          <a
            :id="officialCategory + '-tab'"
            class="nav-link"
            :class="{ active: index === 0 }"
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
      <div id="myTabContent" class="tab-content">
        <div
          v-for="(officialCategory, index) in officialRoleCategories"
          :id="officialCategory"
          :key="index"
          class="tab-pane fade"
          role="tabpanel"
          aria-labelledby="officialCategory + '-tab'"
          :class="{ 'show active': index === 0 }"
        >
          <ul class="list-group list-group-flush">
            <li
              v-for="officialRole in rolesForOfficialCategory(officialCategory)"
              :key="officialRole.id"
              class="list-group-item"
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
import DownloadCSV from "./DownloadCSV.vue";
import MemberList from "./MemberList.vue";
import Gantt from "./Gantt.vue";
import Modal from "./Modal.vue";
import { dayjs, $can } from "../lib";

export default {
  components: {
    SortableLink,
    DownloadCSV,
    MemberList,
    Gantt,
    Modal,
  },
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
          .map((m) => dayjs(m.start_date).unix())
          .reduce((a, b) => Math.min(a, b));
      }
      return 0;
    },
    highestValue: function () {
      var maxDate = null;
      if (this.filteredList.length > 0) {
        maxDate = this.filteredList
          .map((m) => dayjs(m.end_date ? m.end_date : dayjs()).unix())
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
            dayjs(membership.end_date).isAfter(dayjs())
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

          const aCurrentSort = a?.[this.currentSort] || " ";
          const bCurrentSort = b?.[this.currentSort] || " ";

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
          elem.end_date == null || dayjs(elem.end_date).isAfter(dayjs())
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
    $can,
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
    removeMember: function (removeMember, index) {
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
          removeMember.end_date = dayjs().format("YYYY-MM-DD hh:mm:ss");
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
