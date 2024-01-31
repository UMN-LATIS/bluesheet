<template>
  <DefaultLayout v-if="$can('view eligibility')">
    <div class="form-check">
      <input
        id="SSLEligible"
        v-model="eligibility_setting"
        class="form-check-input"
        type="radio"
        name="eligiblity"
        value="ssl_eligible"
      />
      <label class="form-check-label" for="SSLEligible"> SSL Eligible </label>
    </div>

    <div class="form-check">
      <input
        id="SSLApplyEligible"
        v-model="eligibility_setting"
        class="form-check-input"
        type="radio"
        name="eligiblity"
        value="ssl_apply_eligible"
      />
      <label class="form-check-label" for="SSLApplyEligible">
        SSL Application Eligible
      </label>
    </div>
    <div class="form-check">
      <input
        id="MidCareerEligible"
        v-model="eligibility_setting"
        class="form-check-input"
        type="radio"
        name="eligiblity"
        value="midcareer_eligible"
      />
      <label class="form-check-label" for="MidCareerEligible">
        Midcareer Eligible
      </label>
    </div>
    <DownloadCSV
      class="btn btn-info mt-2 mb-2"
      :data="filteredUserList"
      :name="eligibility_setting + '.csv'"
    >
      Download List
    </DownloadCSV>
    <table class="table">
      <thead>
        <tr>
          <th>
            <SortableLink
              sortLabel="Name"
              sortElement="displayName"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th>
            <SortableLink
              sortLabel="Department"
              sortElement="dept_name"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in sortedList" :key="user.id">
          <td>
            <router-link :to="{ name: 'user', params: { userId: user.id } }">
              {{ user.displayName }}
            </router-link>
          </td>
          <td>
            {{ user.dept_name }}
          </td>
        </tr>
      </tbody>
    </table>
  </DefaultLayout>
</template>

<script>
import SortableLink from "@/components/SortableLink.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { axios, sortByValueAtPath } from "@/utils";
import DownloadCSV from "@/components/DownloadCSV.vue";
import { $can } from "@/utils";

export default {
  components: {
    SortableLink,
    DefaultLayout,
    DownloadCSV,
  },
  data() {
    return {
      currentSortDir: "asc",
      currentSort: "displayName",
      userList: [],
      eligibility_setting: "ssl_eligible",
    };
  },
  computed: {
    filteredUserList: function () {
      return this.userList.map((user) => {
        return {
          displayName: user.displayName,
          email: user.email,
          department: user.dept_name,
          deptid: user.deptid,
        };
      });
    },
    sortedList: function () {
      return [...this.userList].sort(
        sortByValueAtPath(this.currentSort, this.currentSortDir),
      );
    },
  },
  watch: {
    eligibility_setting: function () {
      this.userList = [];
      this.loadUsers();
    },
  },
  mounted() {
    this.loadUsers();
  },
  methods: {
    $can,
    loadUsers: function () {
      axios.get("/api/eligibility/" + this.eligibility_setting).then((res) => {
        this.userList = res.data;
      });
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
  },
};
</script>
