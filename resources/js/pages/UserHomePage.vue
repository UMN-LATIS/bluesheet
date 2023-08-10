<template>
  <div>
    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    <ViewUser v-if="user" :user="user" />
    <div v-if="user && !userId" class="col-md-6">
      <div class="form-check">
        <input
          id="send_email_reminders"
          v-model="user.send_email_reminders"
          class="form-check-input"
          type="checkbox"
          @change="updateUser"
        />
        <label class="form-check-label small" for="send_email_reminders">
          Send me occasional reminders to update my groups
        </label>
      </div>
    </div>
    <div v-if="user && !userId" class="col-md-6">
      <div class="form-check">
        <input
          id="notify_of_favorite_changes"
          v-model="user.notify_of_favorite_changes"
          class="form-check-input"
          type="checkbox"
          @change="updateUser"
        />
        <label class="form-check-label small" for="notify_of_favorite_changes">
          Notify me when my favorite groups and roles change
        </label>
      </div>
    </div>
    <Roles id="v-step-4" :memberships="memberships"></Roles>

    <Leaves
      v-if="user && user.leaves"
      :leaves="user.leaves"
      :userId="user.id"
      @update="handleUpdateLeaves"
    ></Leaves>
  </div>
</template>

<script>
import ViewUser from "@/components/ViewUser.vue";
import Roles from "@/components/Roles.vue";
import Leaves from "@/components/Leaves.vue";
export default {
  components: {
    ViewUser,
    Roles,
    Leaves,
  },
  props: ["userId"],
  data() {
    return {
      error: null,
      user: null,
    };
  },
  computed: {
    memberships: function () {
      if (this.user) {
        return this.user.memberships;
      }
      return [];
    },
  },
  watch: {
    userId: function () {
      this.loadUser();
    },
  },
  mounted() {
    this.loadUser();
  },
  methods: {
    updateUser() {
      axios.put("/api/user/" + this.user.id, this.user);
    },
    loadUser() {
      this.error = null;
      var targetUser = "local";
      if (this.userId) {
        targetUser = this.userId;
      }
      axios
        .get("/api/user/" + targetUser)
        .then((res) => {
          this.user = res.data;
        })
        .catch((err) => {
          this.error = err.response.data;
        });
    },
    handleUpdateLeaves(leaves) {
      console.log("leaves updated", leaves);
      this.user.leaves = leaves;
    },
  },
};
</script>
