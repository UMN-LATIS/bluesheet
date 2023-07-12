<template>
  <div>
    <h1>{{ user.displayName }}</h1>
    <ul>
      <li v-if="user.title"><strong>Title: </strong>{{ user.title }}</li>
      <li v-if="user.office">
        <strong>Office: <br /></strong> <span v-html="formattedOffice"></span>
      </li>
      <li v-if="user.email">
        <strong>Email: </strong
        ><a :href="`mailto:${user.email}`">{{ user.email }}</a>
      </li>
      <li>
        <a
          :href="'http://myaccount.umn.edu/lookup?UID=' + usernameOnly"
          target="_blank"
          >Directory Entry</a
        >
      </li>
      <li v-if="$can('edit users')">
        <a :href="'/admin/users/' + user.id + '/edit'">Edit user</a>
      </li>
    </ul>
  </div>
</template>

<script>
import { $can } from "../lib";
export default {
  props: ["user"],
  computed: {
    usernameOnly: function () {
      return this.user.email.split("@").shift();
    },
    formattedOffice: function () {
      return this.user.office.replace(/ \$ /g, "<br />");
    },
  },
  methods: {
    $can,
  },
};
</script>

<style scoped>
ul {
  list-style: none;
}
ul li {
  margin-top: 5px;
  margin-bottom: 5px;
}
</style>
