<template>
  <DefaultLayout>
    <p>
      This list combines the following data.
    </p>
    <ul>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 12 } }"
          >HR Consultant</router-link
        >
      </li>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 13 } }"
          >HR Generalist</router-link
        >
      </li>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 14 } }"
          >Payroll Specialist</router-link
        >
        </li>

    </ul>
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
              sortLabel="HR Consultant"
              sortElement="hrconsultant.0.user.displayName"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th>
            <SortableLink
              sortLabel="HR Generalist"
              sortElement="hrgeneralist.0.user.displayName"
              :currentSort="currentSort"
              :currentSortDir="currentSortDir"
              @sort="sort"
            />
          </th>
          <th>
            <SortableLink
              sortLabel="Payroll Specialist"
              sortElement="payrollspecialist.0.user.displayName"
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
            <UserWithLink :memberList="department.hrConsultant"></UserWithLink>
          </td>
          <td>
            <UserWithLink
              :memberList="department.hrGeneralist"
            ></UserWithLink>
          </td>
          <td>
            <UserWithLink
              :memberList="department.payrollSpecialist"
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

export default {
  components: {
    UserWithLink,
    SortableLink,
    DefaultLayout,
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
        outputObject.hrConsultant = members.filter((m) => m.role.id == 12);
        outputObject.hrGeneralist = members.filter((m) => m.role.id == 13);
        outputObject.payrollSpecialist = members.filter((m) => m.role.id == 14);
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
        roleId: 12, // hr consultant
        groupType: null,
      },
      {
        roleId: 13, // hr generalist
        groupType: null,
      },
      {
        roleId: 14, // payroll specialist
        groupType: null,
      }
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
