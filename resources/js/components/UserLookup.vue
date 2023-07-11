<template>
  <Modal :show="show" @close="close">
    <div class="row">
      <label for="nameLookup" class="col-sm-3 col-form-label">Name:</label>
      <div class="col-sm-6">
        <AutoComplete
          id="nameLookup"
          ref="userAutocompleter"
          v-model="userLookupId"
          source="/api/autocompleter/user?searchType=nameAndInternetId&q="
          resultsProperty="items"
          resultsDisplay="full_name"
          resultsValue="mail"
          inputClass="form-control"
        />
        <small id="addUserHelpBlock" class="form-text text-muted">
          Optional: Enter a name and select the person from the list. For common
          names, we recommend using internet ID (below) to be sure you get the
          right person.
        </small>
      </div>
    </div>

    <div class="row">
      <label for="internetId" class="col-sm-3 col-form-label"
        >Internet ID:</label
      >
      <div class="col-sm-6">
        <input
          id="internetId"
          ref="addMemberRef"
          v-model="userLookupId"
          type="text"
          class="form-control"
          placeholder="Internet ID"
          @keyup="addMemberError = null"
          @keyup.enter="lookupUser"
        />
        <small id="addUserHelpBlock" class="form-text text-muted">
          Enter one or more InternetIds or email addresses (comma-separated ).
        </small>
      </div>
    </div>

    <div class="form-group row">
      <div class="col-sm-3">
        <button class="btn btn-primary" @click="lookupUser">Find User</button>
      </div>
    </div>
    <div class="row">
      <div
        v-if="findUserError"
        class="alert alert-danger col-sm-12"
        role="alert"
      >
        {{ findUserError }}
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal.vue";
import AutoComplete from "vuejs-auto-complete";

export default {
  components: {
    Modal,
    AutoComplete,
  },
  props: ["show"],
  emits: ["close"],
  data() {
    return {
      findUserError: null,
      userLookupId: null,
    };
  },
  watch: {
    show: function (newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.$refs.findMemberRef.focus();
        });
      }
    },
  },
  methods: {
    close: function () {
      this.userLookupId = null;
      this.$emit("close");
    },
    lookupUser: function () {
      axios
        .post("/api/user/lookup", { users: this.userLookupId })
        .then((res) => {
          if (res.data.users.length == 1) {
            this.$router.push({
              name: "user",
              params: { userId: res.data.users[0].id },
            });
            this.close();
          } else {
            this.$router.push({
              name: "userList",
              query: { users: res.data.users.map((u) => u.id) },
            });
            this.close();
          }
        })
        .catch((err) => {
          this.findUserError = err.response.data.message;
        });
    },
  },
};
</script>
