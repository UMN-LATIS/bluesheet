<template>
  <Modal :show="show" @close="close">
    <div class="form-group row">
      <label for="internetId" class="col-sm-3 col-form-label"
        >Group Name:</label
      >
      <div class="col-sm-6">
        <input
          id="groupName"
          ref="groupNameRef"
          v-model="groupName"
          type="text"
          class="form-control"
          placeholder="Group Name"
          @keyup="groupNameError = null"
          @keyup.enter="createGroup"
        />
      </div>
    </div>
    <div class="form-group row">
      <label for="groupType" class="col-sm-3 col-form-label">Group Type</label>
      <div class="col-sm-6">
        <ComboBox
          v-if="groupTypes"
          id="groupTypes"
          v-model="groupType"
          :options="groupTypes"
          placeholder="Select..."
        />
        <VSelect
          v-if="groupTypes"
          id="groupTypes"
          v-model="groupType"
          taggable
          :options="groupTypes"
          placeholder="Select..."
        ></VSelect>
      </div>
    </div>
    <div class="form-group row">
      <label for="parentOrganization" class="col-sm-3 col-form-label"
        >Folder</label
      >
      <div class="col-sm-6">
        <FolderWidget v-model="parentOrganization"></FolderWidget>
      </div>
    </div>
    <div class="form-group row">
      <div class="col-sm-4">
        <button class="btn btn-primary" @click="createGroup">
          Create Group
        </button>
      </div>
    </div>
    <div class="row">
      <div
        v-if="groupNameError"
        class="alert alert-danger col-sm-12"
        role="alert"
      >
        {{ groupNameError }}
      </div>
    </div>
  </Modal>
</template>

<script>
import VSelect from "vue-select";
import Modal from "./Modal.vue";
import FolderWidget from "./FolderWidget.vue";
import ComboBox from "./ComboBox.vue";

export default {
  components: {
    VSelect,
    Modal,
    FolderWidget,
    ComboBox,
  },
  props: ["show"],
  emits: ["close"],
  data() {
    return {
      groupNameError: null,
      groupName: null,
      groupType: null,
      groupTypes: [],
      parentOrganization: null,
    };
  },
  watch: {
    show: function (newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.$refs.groupNameRef.focus();
        });
      }
    },
  },
  mounted() {
    axios
      .get("/api/group/types")
      .then((res) => {
        this.groupTypes = res.data.sort((a, b) =>
          a.label.localeCompare(b.label),
        );
      })
      .catch((err) => {
        console.error(err);
      });
  },
  methods: {
    close: function () {
      this.groupName = null;
      this.$emit("close");
    },
    createGroup: function () {
      if (this.groupName == null) {
        this.groupNameError = "You must enter a group name";
        return;
      }
      if (this.groupType == null) {
        this.groupNameError = "You must select a group type";
        return;
      }
      if (this.parentOrganization == null) {
        this.groupNameError = "You must select a folder";
        return;
      }
      this.groupNameError = null;
      axios
        .post("/api/group", {
          groupName: this.groupName,
          groupType: this.groupType,
          parentOrganization: this.parentOrganization,
        })
        .then((res) => {
          this.$router.push({
            name: "group",
            params: { groupId: res.data.id },
          });
          this.close();
        })
        .catch((err) => {
          this.groupNameError = err.response.data.message;
        });
    },
  },
};
</script>

<style scoped>
.vue-treeselect__control {
  border: 1px solid rgba(60, 60, 60, 0.26);
}
</style>
