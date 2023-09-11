<template>
  <DefaultLayout>
    <p>
      This list combines the following data. Clicking the "show email list"
      button will give you a de-duplicated set of email addresses.
    </p>
    <ul>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 23 } }"
          >All department administrators for academic units and graduate minors
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 22 } }"
          >Academic Chairs</router-link
        >
      </li>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 30 } }"
          >Graduate Program Coordinators</router-link
        >
      </li>
      <li>
        <router-link :to="{ name: 'role', params: { roleId: 18 } }"
          >Director of Graduate Studies</router-link
        >
      </li>
    </ul>
    <Members
      v-if="groupList"
      :members="groupList"
      :editing="false"
      :roles="[]"
      :show_unit="true"
      groupType="list"
      viewType="role"
      downloadTitle="ORGP"
    />
  </DefaultLayout>
</template>

<script>
import Members from "@/components/Members.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

export default {
  components: {
    Members,
    DefaultLayout,
  },
  data() {
    return {
      groupList: [],
      groupsToLoad: [],
    };
  },
  computed: {},
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
        roleId: 23, // academic chair
        groupType: 3,
      },
      {
        roleId: 22, // academic chair
        groupType: null,
      },
      {
        roleId: 30, // Director
        groupType: null,
      },
      {
        roleId: 18, // Research support center admin
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
        // filter IGS
        filteredMembers = filteredMembers.filter((m) => m.group.id != 54);
        this.groupList = [...this.groupList, ...filteredMembers];
      });
    }
  },
  methods: {},
};
</script>
