<template>
  <DefaultLayout>
    <p>
      This list combines the following data. Clicking the "show email list"
      button will give you a de-duplicated set of email addresses.
    </p>
    <ul>
      <li>
        Collegiate Governance
        <ul>
          <li>
            <router-link :to="{ name: 'group', params: { groupId: 2 } }"
              >CLA Assembly</router-link
            >
          </li>
          <li>
            <router-link :to="{ name: 'group', params: { groupId: 4 } }"
              >Curriculum, Instruction & Advisory</router-link
            >
          </li>
          <li>
            <router-link :to="{ name: 'group', params: { groupId: 19 } }"
              >P&A Board</router-link
            >
          </li>
          <li>
            <router-link :to="{ name: 'group', params: { groupId: 25 } }"
              >Course Review Committee</router-link
            >
          </li>
          <li>
            <router-link :to="{ name: 'group', params: { groupId: 28 } }"
              >University Senate</router-link
            >
          </li>
          <li>
            <router-link :to="{ name: 'group', params: { groupId: 108 } }"
              >CLA Staff Council Executive Committee</router-link
            >
          </li>
          <li>
            <router-link :to="{ name: 'group', params: { groupId: 157 } }"
              >Council of Chairs (CoC)</router-link
            >
          </li>
        </ul>
      </li>
      <li>
        Dean's Office
        <ul>
          <li>
            <router-link :to="{ name: 'group', params: { groupId: 1 } }"
              >CLA Promotion and Tenure Review Committee</router-link
            >
          </li>
        </ul>
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
      downloadTitle="CommitteeService"
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
      groupsToLoad: [2, 4, 19, 25, 28, 108, 157, 1],
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
  },
  methods: {},
};
</script>
