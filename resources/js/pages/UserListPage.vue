<template>
  <DefaultLayout>
    <div class="toggles">
      <span
        class="committee groupBadge"
        :class="{ badgeOn: committee }"
        @click="committee = !committee"
        >Committee</span
      >
      <span
        class="department groupBadge"
        :class="{ badgeOn: department }"
        @click="department = !department"
        >Department</span
      >
      <span
        class="list groupBadge"
        :class="{ badgeOn: list }"
        @click="list = !list"
        >List</span
      >
      <span
        class="group groupBadge"
        :class="{ badgeOn: group }"
        @click="group = !group"
        >Group</span
      >
    </div>

    <table class="table">
      <thead>
        <tr>
          <th scope="col">User</th>
          <th scope="col">Current Membership Count</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in loadedUsers" :key="user.id">
          <td>
            <router-link
              v-if="user.id"
              :to="{ name: 'user', params: { userId: user.id } }"
            >
              {{ user.surname }}, {{ user.givenname }}
            </router-link>
          </td>
          <td>
            <span v-if="committee" class="committee groupBadge">{{
              user.memberships.filter(
                (elem) =>
                  (elem.end_date == null ||
                    dayjs(elem.end_date).isAfter(dayjs())) &&
                  elem.group.group_type_id == 1,
              ).length
            }}</span>
            <span v-if="department" class="department groupBadge">{{
              user.memberships.filter(
                (elem) =>
                  (elem.end_date == null ||
                    dayjs(elem.end_date).isAfter(dayjs())) &&
                  elem.group.group_type_id == 3,
              ).length
            }}</span>
            <span v-if="list" class="list groupBadge">{{
              user.memberships.filter(
                (elem) =>
                  (elem.end_date == null ||
                    dayjs(elem.end_date).isAfter(dayjs())) &&
                  elem.group.group_type_id == 2,
              ).length
            }}</span>
            <span v-if="group" class="group groupBadge">{{
              user.memberships.filter(
                (elem) =>
                  (elem.end_date == null ||
                    dayjs(elem.end_date).isAfter(dayjs())) &&
                  elem.group.group_type_id == 4,
              ).length
            }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="toggles">
      <span
        class="committee groupBadge"
        :class="{ badgeOn: committee }"
        @click="committee = !committee"
        >Committee</span
      >
      <span
        class="department groupBadge"
        :class="{ badgeOn: department }"
        @click="department = !department"
        >Department</span
      >
      <span
        class="list groupBadge"
        :class="{ badgeOn: list }"
        @click="list = !list"
        >List</span
      >
      <span
        class="group groupBadge"
        :class="{ badgeOn: group }"
        @click="group = !group"
        >Group</span
      >
    </div>
  </DefaultLayout>
</template>

<script>
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { dayjs } from "@/utils";
import { usePageTitle } from "@/utils/usePageTitle";

export default {
  components: { DefaultLayout },
  props: ["users", "groupId"],
  data() {
    return {
      loadedUsers: [],
      committee: true,
      group: true,
      list: true,
      department: true,
    };
  },
  computed: {
    // a single watch source, so a navigation changing both props loads once
    userListQuery() {
      return { users: this.users, groupId: this.groupId };
    },
  },
  watch: {
    userListQuery: "loadUsersFromProps",
  },
  mounted() {
    usePageTitle("Users");
    this.loadUsersFromProps();
  },
  methods: {
    dayjs,
    loadUsersFromProps() {
      if (this.users) {
        this.loadUsers(this.users);
      }

      const requestedGroupId = this.groupId;
      if (!requestedGroupId) return;

      axios
        .get("/api/group/" + requestedGroupId + "/members")
        .then((res) => {
          // drop a response superseded by a newer group
          if (requestedGroupId !== this.groupId) return;

          const activeMemberUserIds = res.data
            .filter(
              (member) =>
                member.end_date == null ||
                dayjs(member.end_date).isAfter(dayjs()),
            )
            .map((member) => member.user.id);

          this.loadUsers(activeMemberUserIds);
        })
        .catch((err) => {
          this.error = err.response.data;
        });
    },
    loadUsers(userList) {
      const { users: requestedUsers, groupId: requestedGroupId } = this;

      axios
        .post("/api/user/lookup", {
          users: userList,
        })
        .then((res) => {
          // drop a response superseded by a newer navigation. The lookup is
          // the second request of a chain, so an older one can land last.
          if (requestedUsers !== this.users) return;
          if (requestedGroupId !== this.groupId) return;

          this.loadedUsers = res.data.users;
        })
        .catch((err) => {
          this.error = err.response.data.message;
        });
    },
  },
};
</script>

<style scoped>
.groupBadge {
  border-radius: 10px;
  padding: 3px 8px;
  margin-left: 1px;
  margin-right: 1px;
}

.toggles .groupBadge {
  cursor: pointer;
}

.committee {
  background-color: orange;
}

.department {
  background-color: lightgreen;
}

.list {
  background-color: lightblue;
}

.group {
  background-color: lightyellow;
}

.badgeOn {
  box-shadow:
    inset 0 0 0 0px #27496d,
    inset 0 1px 2px #193047;
}
</style>
