<template>
  <div>
    <div class="toggles">
      <span
        class="committee groupBadge"
        @click="committee = !committee"
        v-bind:class="{ badgeOn: committee }"
        >Committee</span
      >
      <span
        class="department groupBadge"
        @click="department = !department"
        v-bind:class="{ badgeOn: department }"
        >Department</span
      >
      <span
        class="list groupBadge"
        @click="list = !list"
        v-bind:class="{ badgeOn: list }"
        >List</span
      >
      <span
        class="group groupBadge"
        @click="group = !group"
        v-bind:class="{ badgeOn: group }"
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
              :to="{ name: 'user', params: { userId: user.id } }"
              v-if="user.id"
            >
              {{ user.surname }}, {{ user.givenname }}
            </router-link>
          </td>
          <td>
            <span v-if="committee" class="committee groupBadge">{{
              user.memberships.filter(
                (elem) =>
                  (elem.end_date == null ||
                    $moment(elem.end_date).isAfter($moment())) &&
                  elem.group.group_type_id == 1,
              ).length
            }}</span>
            <span v-if="department" class="department groupBadge">{{
              user.memberships.filter(
                (elem) =>
                  (elem.end_date == null ||
                    $moment(elem.end_date).isAfter($moment())) &&
                  elem.group.group_type_id == 3,
              ).length
            }}</span>
            <span v-if="list" class="list groupBadge">{{
              user.memberships.filter(
                (elem) =>
                  (elem.end_date == null ||
                    $moment(elem.end_date).isAfter($moment())) &&
                  elem.group.group_type_id == 2,
              ).length
            }}</span>
            <span v-if="group" class="group groupBadge">{{
              user.memberships.filter(
                (elem) =>
                  (elem.end_date == null ||
                    $moment(elem.end_date).isAfter($moment())) &&
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
        @click="committee = !committee"
        v-bind:class="{ badgeOn: committee }"
        >Committee</span
      >
      <span
        class="department groupBadge"
        @click="department = !department"
        v-bind:class="{ badgeOn: department }"
        >Department</span
      >
      <span
        class="list groupBadge"
        @click="list = !list"
        v-bind:class="{ badgeOn: list }"
        >List</span
      >
      <span
        class="group groupBadge"
        @click="group = !group"
        v-bind:class="{ badgeOn: group }"
        >Group</span
      >
    </div>
  </div>
</template>

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

<script>
import Vue from "vue";

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
  methods: {
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
  mounted() {
    if (this.users) {
      this.loadUsers(this.users);
    }
    if (this.groupId) {
      axios.get("/api/group/" + this.groupId).then((res) => {
        this.group = res.data;
        Vue.set(this.group, "members", []);
        this.group.members = [];
        axios
          .get("/api/group/" + this.groupId + "/members")
          .then((res) => {
            Vue.set(this.group, "members", res.data);
            var users = this.group.members
              .filter(
                (e) =>
                  e.end_date == null ||
                  this.$moment(e.end_date).isAfter(this.$moment()),
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
};
</script>
