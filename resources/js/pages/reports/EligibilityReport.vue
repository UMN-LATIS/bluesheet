<template>
  <DefaultLayout>
    <div class="form-check">
      <input class="form-check-input" type="radio" name="eligiblity" v-model="eligibility_setting" id="SSLEligible" value="ssl_eligible">
      <label class="form-check-label" for="SSLEligible">
        SSL Eligible
      </label>
    </div>
    
    <div class="form-check">
      <input class="form-check-input" type="radio" name="eligiblity" v-model="eligibility_setting" id="SSLApplyEligible" value="ssl_apply_eligible">
      <label class="form-check-label" for="SSLApplyEligible">
        SSL Application Eligible
      </label>
    </div>
    <div class="form-check">
      <input class="form-check-input" type="radio" name="eligiblity" v-model="eligibility_setting" id="MidCareerEligible" value="midcareer_eligible">
      <label class="form-check-label" for="MidCareerEligible">
        Midcareer Eligible
      </label>
    </div>
    <DownloadCSV
        class="btn btn-info"
        :data="userList"
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
              sortElement="name"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th>
            <SortableLink
              sortLabel="Department"
              sortElement="department"
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
import { axios } from "@/lib";
import DownloadCSV from "@/components/DownloadList.vue";

export default {
  components: {
    SortableLink,
    DefaultLayout,
    DownloadCSV
  },
  data() {
    return {
      currentSortDir: "desc",
      currentSort: "lastModified",
      userList: [],
      eligibility_setting: 'ssl_eligible'
    };
  },
  computed: {
    sortedList: function () {
      return [...this.userList]
        .sort((a, b) => {
          let modifier = 1;
          if (this.currentSortDir === "desc") modifier = -1;

          const aCurrentSort = a?.[this.currentSort] || " ";
          const bCurrentSort = b?.[this.currentSort] || " ";

          if (aCurrentSort.toLowerCase() < bCurrentSort.toLowerCase())
            return -1 * modifier;
          if (aCurrentSort.toLowerCase() > bCurrentSort.toLowerCase())
            return 1 * modifier;
          return 0;
        });
    }
  },
  watch: {
    eligibility_setting: function() {
        this.userList = [];
        this.loadUsers();
    }
  },
  mounted() {
    this.loadUsers();
  },
  methods: {
    loadUsers: function() {
        axios.get('/api/eligibility/' + this.eligibility_setting)
        .then((res) => {
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
