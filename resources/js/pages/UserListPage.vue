<template>
  <div>
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
  </div>
</template>

<script>
import { dayjs } from "@/lib";

export default {
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
  mounted() {
    if (this.users) {
      this.loadUsers(this.users);
    }
    if (this.groupId) {
      axios.get("/api/group/" + this.groupId).then((res) => {
        this.group = res.data;
        this.group.members = [];
        axios
          .get("/api/group/" + this.groupId + "/members")
          .then((res) => {
            this.group.members = res.data;
            var users = this.group.members
              .filter(
                (e) => e.end_date == null || dayjs(e.end_date).isAfter(dayjs()),
              )
              .map((elem) => elem.user.id);
            this.loadUsers(users);
          })
          .catch((err) => {
            this.error = err.response.data;
          });
      });
    }
  },
  methods: {
    dayjs,
    loadUsers(userList) {
      axios
        .post("/api/user/lookup", {
          users: userList,
        })
        .then((res) => {
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
