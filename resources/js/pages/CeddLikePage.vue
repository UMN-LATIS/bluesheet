<template>
  <div>
    <p>
      This list combines the following data. Clicking the "show email list"
      button will give you a de-duplicated set of email addresses.
    </p>
    <ul>
      <li>
        All department administrators for
        <router-link :to="{ name: 'role', params: { roleId: 23 } }"
          >academic
        </router-link>
        and
        <router-link :to="{ name: 'role', params: { roleId: 39 } }"
          >non-academic units
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 22 } }"
          >All members of Council of Chairs (all faculty leaders for the 31
          academic departments)</router-link
        >
        (all users with "Academic Chair" role)
      </li>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 22 } }"
          >All CLA center directors (users with the role "director" in a group
          of type "center"</router-link
        >
      </li>
      <li>
        <router-link :to="{ name: 'group', params: { groupId: 129 } }"
          >All members of the CLA Executive Committee</router-link
        >
      </li>
      <li>
        <router-link :to="{ name: 'group', params: { groupId: 128 } }"
          >All Dean's Group members</router-link
        >
      </li>
      <li>
        <router-link :to="{ name: 'group', params: { groupId: 83 } }"
          >All OLT members</router-link
        >
      </li>
      <li>
        <router-link :to="{ name: 'group', params: { groupId: 130 } }"
          >And a list of other misc people
        </router-link>
      </li>
    </ul>
    <members
      v-if="groupList"
      :members="groupList"
      :editing="false"
      :roles="[]"
      :show_unit="true"
      groupType="list"
      viewType="role"
      downloadTitle="CEDD Like"
    />
  </div>
</template>

<script>
import Members from "../components/Members.vue";

export default {
  components: {
    Members,
  },
  data() {
    return {
      groupList: [],
      groupsToLoad: [83, 128, 129, 130],
    };
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
        roleId: 22, // academic chair
        groupType: null,
      },
      {
        roleId: 40, // Director
        groupType: 5,
      },
      {
        roleId: 39, // Research support center admin
        groupType: null,
      },
      {
        roleId: 23, // academic department admin
        groupType: 3,
      },
    ];

    for (let role of roleList) {
      await axios.get("/api/role/" + role.roleId).then((res) => {
        let filteredMembers = null;
        if (role.groupType) {
          filteredMembers = res.data.members.filter(
            (m) => m.group.group_type_id == role.groupType,
          );
        } else {
          filteredMembers = res.data.members;
        }
        this.groupList = [...this.groupList, ...filteredMembers];
      });
    }
  },
  computed: {},
  methods: {},
};
</script>
