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
        >
          <template #append="{ close: closeCombobox }">
            <form
              class="other-option-group"
              @submit.prevent="addNewGroupType"
              @keydown.enter.stop="addNewGroupType"
            >
              <input v-model="newGroupType" type="text" placeholder="Other" />
              <button
                type="submit"
                :disabled="!newGroupType"
                @click="
                  () => {
                    handleAddNewGroupType();
                    closeCombobox();
                  }
                "
              >
                <CheckIcon />
                <span class="sr-only">Add Option</span>
              </button>
            </form>
          </template>
        </ComboBox>
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
import Modal from "./Modal.vue";
import FolderWidget from "./FolderWidget.vue";
import ComboBox from "./ComboBox.vue";
import CheckIcon from "@/icons/CheckIcon.vue";

export default {
  components: {
    Modal,
    FolderWidget,
    ComboBox,
    CheckIcon,
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
      newGroupType: "",
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
    handleAddNewGroupType() {
      const newOption = {
        id: this.newGroupType,
        label: this.newGroupType,
      };
      this.groupTypes.push(newOption);
      this.groupType = newOption;
      this.newGroupType = "";
    },
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

      // if the id of the groupType is a string and equivalent to the label,
      // then it is a new group type
      // added by the user, so we should not include the id in the post request
      const isNewGroupType =
        typeof this.groupType.id === "string" &&
        this.groupType.id === this.groupType.label;

      axios
        .post("/api/group", {
          groupName: this.groupName,
          groupType: isNewGroupType
            ? { label: this.groupType.label }
            : this.groupType,
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
