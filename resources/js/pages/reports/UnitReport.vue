<template>
  <DefaultLayout>
    <p>
      This list combines the following data.
    </p>
    <ul>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 22 } }"
          >Academic Chair</router-link> /  <router-link :to="{ name: 'role', params: { roleId: 40 } }"
          >Administrative Directory</router-link> / <router-link :to="{ name: 'role', params: { roleId: 82 } }"
          >Center/Program Director</router-link>

      </li>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 23 } }"
          >Academic Department Administrator</router-link> / <router-link :to="{ name: 'role', params: { roleId: 39 } }"
          >Research Center Admin</router-link> / <router-link :to="{ name: 'role', params: { roleId: 68 } }"
          >Admin Unit Administrator</router-link>

      </li>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 11 } }"
          >Accountant</router-link
        >
      </li>
    </ul>
    <DownloadCSV
      class="btn btn-info mt-2 mb-2"
      :data="flattenedList"
      name="unitreport.csv"
    >
      Download List
    </DownloadCSV>
    <table class="table">
      <thead>
        <tr>
          <th>
            <SortableLink
              sortLabel="DeptId"
              sortElement="dept_id"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th>
            <SortableLink
              sortLabel="ZDeptId"
              sortElement="zdept_id"
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
          <th>
            <SortableLink
              sortLabel="Leader"
              sortElement="accountant.0.user.displayName"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th>
            <SortableLink
              sortLabel="Administrator"
              sortElement="financeManager.0.user.displayName"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th>
            <SortableLink
              sortLabel="Accountant"
              sortElement="accountant.0.user.displayName"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="department in sortedListByDepartment"
          :key="department.dept_id"
        >
          <td>{{ department.dept_id }}</td>
          <td>{{ department.zdept_id }}</td>
          <td>
            <router-link
              :to="{ name: 'group', params: { groupId: department.group.id } }"
              >{{ department.department }}</router-link
            >
          </td>
          <td>
            <UserWithLink :memberList="department.leader"></UserWithLink>
          </td>
          <td>
            <UserWithLink
              :memberList="department.administrator"
            ></UserWithLink>
          </td>
          <td>
            <UserWithLink
              :memberList="department.accountant"
            ></UserWithLink>
          </td>
        </tr>
      </tbody>
    </table>
  </DefaultLayout>
</template>

<script>
import UserWithLink from "@/components/UserWithLink.vue";
import SortableLink from "@/components/SortableLink.vue";
import { dayjs } from "@/utils";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { get as getValueAtPath, uniqBy } from "lodash";
import { sortByValueAtPath } from "@/utils/sortByValueAtPath";
import DownloadCSV from "@/components/DownloadCSV.vue";

export default {
  components: {
    UserWithLink,
    SortableLink,
    DefaultLayout,
    DownloadCSV
  },
  data() {
    return {
      groupList: [],
      groupsToLoad: [],
      currentSort: "dept_id",
      currentSortDir: "asc",
      uniqueGroups: [],
      fullList: [],
      extraDepartmentInfo: [],
    };
  },
  computed: {
    listByDepartment: function () {
      let listByDepartment = [];
      for (let group of this.uniqueGroups) {
        let members = this.fullList.filter((m) => m.group.id == group);
        let outputObject = {};
        let deptInfo = this.extraDepartmentInfo.filter(
          (d) => d.DEPT_ID == members[0].group.dept_id,
        );
        if (deptInfo.length > 0) {
          outputObject.zdept_id = deptInfo[0].ZDEPT_ID;
        }
        outputObject.dept_id = members[0].group.dept_id;
        outputObject.department = members[0].group.group_title;
        outputObject.group = members[0].group;
        outputObject.leader = members.filter((m) => [22, 40, 82].includes(m.role.id));
        outputObject.administrator = members.filter((m) => [23,39,68].includes(m.role.id));
        outputObject.accountant = members.filter((m) => m.role.id == 11);
        listByDepartment.push(outputObject);
      }

      // dedupe
      return uniqBy(listByDepartment, "dept_id");
    },
    sortedListByDepartment() {
      return [...this.listByDepartment].sort(
        sortByValueAtPath(this.currentSort, this.currentSortDir),
      );
    },
    flattenedList() {
      return this.sortedListByDepartment.map((d) => {
        return {
          dept_id: d.dept_id,
          zdept_id: d.zdept_id,
          department: d.department,
          leader: d.leader.map((l) => l.user.email).join(", "),
          administrator: d.administrator.map((a) => a.user.email).join(", "),
          accountant: d.accountant.map((a) => a.user.email).join(", "),
        };
      });
    }
  },
  async mounted() {
    for (let group of this.groupsToLoad) {
      var groupData = await axios.get("/api/group/" + group);
      await axios.get("/api/group/" + group + "/members").then((res) => {
        this.groupList = [
          ...this.groupList,
          ...res.data.map((g) => {
            g.group = groupData.data;
            return g;
          }),
        ];
      });
    }
    const roleList = [
      {
        roleId: 22, 
        groupType: null,
      },
      {
        roleId: 40,
        groupType: null,
      },
      {
        roleId: 82,
        groupType: null,
      },
      {
        roleId: 23,
        groupType: null,
      },
      {
        roleId: 39,
        groupType: null,
      },
      {
        roleId: 68,
        groupType: null,
      },
      {
        roleId: 11,
        groupType: null,
      },
    ];

    let fullList = [];
    for (let role of roleList) {
      await axios.get("/api/role/" + role.roleId).then((res) => {
        let filteredMembers = res.data.members.filter((m) => {
          return !m.end_date || dayjs(m.end_date).isAfter(dayjs());
        });

        fullList = [...fullList, ...filteredMembers];
      });
    }
    let groups = fullList.map((m) => {
      return m.group.id;
    });
    this.uniqueGroups = [...new Set(groups)];
    let deptIds = fullList.map((m) => m.group.dept_id).filter((d) => d != null);
    this.fullList = fullList;
    let uniqueDeptIds = [...new Set(deptIds)];

    if (uniqueDeptIds.length > 0) {
      let deptIdQueryString = new URLSearchParams(
        uniqueDeptIds.map((s) => ["deptId[]", s]),
      );
      axios
        .get("/api/lookup/department/?" + deptIdQueryString.toString())
        .then((res) => {
          this.extraDepartmentInfo = res.data;
        });
    }
  },
  methods: {
    dayjs,
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
