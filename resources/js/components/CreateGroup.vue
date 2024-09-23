<template>
  <Modal
    :show="show"
    :title="parentGroup ? `Create Subgroup` : `Create Group`"
    @close="close"
  >
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
          :options="sortedGroupTypes"
          placeholder="Select..."
          :canAddNewOptions="true"
          :nullable="true"
          label="Group Type"
          :showLabel="false"
          @addNewOption="
            (newGroupType) => (groupTypes = [...groupTypes, newGroupType])
          "
        />
      </div>
    </div>
    <div v-if="!parentGroup" class="form-group row">
      <label for="parentOrganization" class="col-sm-3 col-form-label"
        >Folder</label
      >
      <div class="col-sm-6">
        <FolderWidget id="parentOrganization" v-model="parentOrganization" />
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
import Modal from "./Modal.vue";
import FolderWidget from "./FolderWidget.vue";
import { ComboBox } from "./ComboBox";
import { mapStores } from "pinia";
import { useGroupStore } from "@/stores/useGroupStore";

export default {
  components: {
    Modal,
    FolderWidget,
    ComboBox,
  },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    parentGroup: {
      type: Object, // Group
      default: undefined,
    },
  },
  emits: ["close", "groupCreated"],
  data() {
    return {
      groupNameError: null,
      groupName: null,
      groupType: null,
      groupTypes: [],
      parentOrganization: this.parentGroup
        ? this.parentGroup.parent_organization_id
        : null,
    };
  },
  computed: {
    ...mapStores(useGroupStore),
    sortedGroupTypes() {
      return this.groupTypes.toSorted((a, b) => a.label.localeCompare(b.label));
    },
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
        this.groupTypes = res.data;
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
    async createGroup() {
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

      const newGroup = await this.groupStore.createGroup({
        groupName: this.groupName,
        groupType: this.groupType,
        parentOrganization: this.parentOrganization,
        parentGroupId: this.parentGroup ? this.parentGroup.id : null,
      });

      this.close();

      // if this is not a subgroup, then redirect to the new group
      if (!this.parentGroup) {
        this.$router.push({
          name: "group",
          params: { groupId: newGroup.id },
        });
      }
    },
  },
};
</script>

<style scoped>
.vue-treeselect__control {
  border: 1px solid rgba(60, 60, 60, 0.26);
}

.other-option-group {
  display: flex;
  margin: 0.5rem;
  padding-top: 0;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
}

.other-option-group input {
  flex: 1;
  background: #f3f3f3;
  border: 0;
  padding: 0.5rem 0.75rem;
  border-top-left-radius: 0.25rem;
  border-bottom-left-radius: 0.25rem;
}

.other-option-group button {
  background: trasparent;
  border: none;
  border-top-right-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ddd;
}
.other-option-group button:not(:disabled):hover {
  background: #111;
}

.other-option-group button:not(:disabled) {
  background: #333;
}
</style>
