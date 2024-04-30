<template>
  <div>
    <Modal :show="showError" @close="showError = !error">
      <div v-if="saveError" class="alert alert-danger col-sm-12" role="alert">
        {{ saveError }}
      </div>
      <button class="btn btn-primary" @click="showError = false">Close</button>
    </Modal>
    <div class="row">
      <div class="col-md-12">
        <div class="form-group row">
          <div class="col-sm-6">
            <div class="form-group">
              <label for="groupTitle" class="small">Group Title</label>
              <input
                id="groupTitle"
                v-model="localGroup.group_title"
                class="form-control"
                type="text"
              />
            </div>
          </div>
          <div class="col-sm-3">
            <div class="form-group">
              <label for="abbreviation" class="small">Abbreviation</label>
              <input
                id="abbreviation"
                v-model="localGroup.abbreviation"
                class="form-control"
              />
            </div>
          </div>
          <div class="col-sm-3">
            <button class="btn btn-success float-right" @click="save">
              Save
            </button>
            <button
              class="btn btn-outline-primary float-right"
              @click="
                $emit('update:editing', false);
                $emit('update:reload');
              "
            >
              Cancel Editing
            </button>
          </div>
        </div>
        <div class="row">
          <div class="col-sm-4">
            <div class="form-group">
              <label for="groupType" class="small">Group Type</label>
              <ComboBox
                v-if="groupTypes"
                id="groupTypes"
                v-model="localGroup.group_type"
                :options="groupTypes"
                placeholder="Select..."
                :canAddNewOption="true"
                label="Group Type"
                :showLabel="false"
                @addNewOption="(newGroupType) => groupTypes.push(newGroupType)"
              />
            </div>
          </div>

          <div class="col-sm-4">
            <div class="form-group">
              <label for="parentOrganization" class="small">Folder</label>
              <FolderWidget
                v-model="localGroup.parent_organization.id"
              ></FolderWidget>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="form-group">
              <label for="parentGroup" class="small">Parent Group</label>
              <ComboBox
                v-if="groups"
                id="groups"
                :modelValue="parentGroup"
                :options="groups"
                placeholder="Select..."
                label="Parent Group"
                :showLabel="false"
                @update:modelValue="handleUpdateParentGroup"
              />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <label for="googleGroup" class="small">Google Group Name</label>
            <input
              id="googleGroup"
              v-model="localGroup.google_group"
              class="form-control"
            />
          </div>
          <div class="col-sm-3">
            <!-- CSS Class overrides make the input look like Bootstrap. -->
            <InputGroup
              v-model="localGroup.dept_id"
              label="Department ID"
              :showLabel="true"
              class="tw-flex-1"
              :validator="isValidDeptId"
              :validateWhenUntouched="true"
              errorText="Must be a number"
              labelClass="!tw-text-sm tw-normal-case tw-mb-2 tw-text-neutral-800"
              inputClass="!tw-text-base"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-check">
              <input
                id="showunit"
                v-model="localGroup.show_unit"
                class="form-check-input"
                type="checkbox"
              />
              <label class="form-check-label small" for="showunit">
                Show Unit
              </label>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-check">
              <input
                id="includechildgroups"
                v-model="localGroup.include_child_groups"
                class="form-check-input"
                type="checkbox"
              />
              <label class="form-check-label small" for="includechildgroups">
                Include Child Groups in Member List
              </label>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <label for="groupNotes" class="small">Group Notes</label>
            <textarea
              id="groupNotes"
              v-model="localGroup.notes"
              class="form-control"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
    <div class="row" data-cy="group-artifacts-section">
      <div class="col-md-12">
        <div class="row">
          <div class="col-md-12">
            <button
              class="btn btn-outline-primary float-right"
              @click="addArtifact"
            >
              Add Artifact <i class="fas fa-plus"></i>
            </button>
            <p>Artifacts:</p>
          </div>
        </div>
        <div
          v-for="(artifact, key) in localGroup.artifacts"
          :key="key"
          class="form-row tw-flex tw-items-start tw-gap-2"
        >
          <InputGroup
            v-model="artifact.label"
            label="Label"
            required
            placeholder="Label"
            :showLabel="false"
            class="tw-flex-1"
            :validateWhenUntouched="true"
            :isValid="!!artifact.label"
            data-cy="artifact-label"
          />
          <InputGroup
            v-model="artifact.target"
            label="Target URL"
            required
            placeholder="Target URL"
            :showLabel="false"
            class="tw-flex-1"
            :validateWhenUntouched="true"
            :isValid="isValidUrl(artifact.target)"
            errorText="Invalid URL. Must be like 'https://umn.edu'"
            data-cy="artifact-target"
          />
          <button class="btn btn-danger tw-py-1" @click="removeArtifact(key)">
            <i class="fas fa-trash-alt tw-m-0"></i>
            <span class="sr-only">Remove Artifact</span>
          </button>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <button
          class="btn btn-outline-primary float-right"
          @click="addMember = true"
        >
          Add Member <i class="fas fa-plus"></i>
        </button>
        <p>Members:</p>
      </div>
    </div>
    <Members
      v-model:members="localGroup.members"
      :groupType="localGroup.group_type.label"
      :show_unit="localGroup.show_unit"
      editing="true"
      :roles="filteredRoles"
      viewType="group"
      :downloadTitle="localGroup.group_title"
      :group="group"
      @update:members="handleUpdateMembers"
      @update:roles="(updatedRoles) => (roles = updatedRoles)"
    ></Members>

    <div class="row border border-danger rounded deactivate">
      <div class="col-sm-12">
        <strong
          >If you deactivate this group, all members will be removed and an
          administrator will be required to reactivate it.</strong
        >
        <button class="btn btn-danger float-right" @click="deactivate">
          Deactivate Group
        </button>
      </div>
    </div>

    <Modal :show="addMember" @close="addMember = !addMember">
      <div class="row">
        <label for="nameLookup" class="col-sm-3 col-form-label">Name:</label>
        <div class="col-sm-6">
          <PersonSearch
            v-model="userLookupText"
            @selected="handleUserSelected"
          />
          <small id="addUserHelpBlock" class="form-text text-muted">
            Optional: Enter a name and select the person from the list
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
            v-model="newUserId"
            type="text"
            class="form-control"
            placeholder="Internet ID"
            @keyup="addMemberError = null"
            @keyup.enter="lookupMember"
          />
          <small id="addUserHelpBlock" class="form-text text-muted">
            Enter one or more InternetIds or email addresses (comma-separated).
            You can add a list of users, even if it's in the format "John Smith
            &lt;smith@umn.edu&gt;, Jane Doe &lt;jane@umn.edu&gt;".
          </small>
        </div>
      </div>
      <div class="row">
        <label for="roles" class="col-sm-3 col-form-label">Role:</label>
        <div class="col-sm-6">
          <ComboBox
            v-if="roles"
            id="roles"
            v-model="newRole"
            :options="filteredRoles"
            :canAddNewOption="true"
            label="Role"
            :showLabel="false"
            @addNewOption="(newOption) => roles.push(newOption)"
          />
        </div>
        <div class="col-sm-3">
          <button
            class="btn btn-primary"
            style="white-space: nowrap"
            @click="lookupMember"
          >
            Add Member
          </button>
        </div>
      </div>
      <div class="row">
        <div
          v-if="addMemberError"
          class="alert alert-danger col-sm-12"
          role="alert"
        >
          {{ addMemberError }}
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import ComboBox from "./ComboBox.vue";
import Members from "./Members.vue";
import Modal from "./Modal.vue";
import FolderWidget from "./FolderWidget.vue";
import PersonSearch from "./PersonSearch.vue";
import { dayjs, axios, isValidUrl } from "@/utils";
import InputGroup from "./InputGroup.vue";

export default {
  components: {
    Members,
    Modal,
    FolderWidget,
    PersonSearch,
    ComboBox,
    InputGroup,
  },
  props: ["group"],
  emits: ["update:editing", "update:reload"],
  data() {
    return {
      // copy of the group object to avoid
      // mutating the prop directly
      localGroup: this.group,
      addMember: false,
      newUserId: null,
      userLookupText: "",
      newRole: null,
      addMemberError: null,
      showError: false,
      saveError: null,
      roles: null,
      groupTypes: null,
      groups: null,
    };
  },
  computed: {
    parentGroup() {
      if (!this.groups?.length || !this.localGroup) return null;
      return (
        this.groups.find(
          (group) => group.id == this.localGroup.parent_group_id,
        ) ?? null
      );
    },
    filteredRoles: function () {
      if (!this.roles) {
        return [];
      }
      return this.roles;
    },
    groupURL: function () {
      return (
        window.location.protocol +
        "//" +
        window.location.hostname +
        (window.location.port ? ":" + window.location.port : "") +
        "/group/" +
        this.localGroup.id +
        "/" +
        this.localGroup.secret_hash
      );
    },
  },
  watch: {
    addMember: function (newVal) {
      if (newVal == true) {
        this.$nextTick(() => {
          this.$refs.addMemberRef.focus();
        });
      }
    },
  },
  mounted() {
    axios
      .get("/api/group/roles/")
      .then((res) => {
        this.roles = res.data;
      })
      .catch((err) => {
        this.error = err.response.data;
      });
    axios
      .get("/api/group/types")
      .then((res) => {
        this.groupTypes = res.data;
        if (
          this.groupTypes.filter((e) => e.id == this.localGroup.group_type.id)
            .length == 0
        ) {
          this.groupTypes.push(this.localGroup.group_type);
        }
        this.groupTypes = this.groupTypes.sort((a, b) => {
          return a.label.localeCompare(b.label);
        });
      })
      .catch((err) => {
        console.error(err);
      });

    axios
      .get("/api/group")
      .then((res) => {
        this.groups = res.data
          .filter((e) => e.active_group)
          .filter((e) => e.id != this.localGroup.id)
          .map((e) => {
            return {
              id: e.id,
              label: e.group_title,
            };
          })
          .sort(function (a, b) {
            return a.label > b.label;
          });
      })
      .catch((err) => {
        console.error(err);
      });
  },
  methods: {
    isValidUrl,
    isValidDeptId(str) {
      if (!str) return true;
      return /^[0-9]+$/.test(str);
    },
    handleUpdateParentGroup(group) {
      this.localGroup.parent_group_id = group?.id ?? null;
    },
    handleUserSelected(user) {
      this.newUserId = user.mail;

      // reset user lookup input
      this.userLookupText = "";

      this.$nextTick(() => {
        this.$refs.addMemberRef.focus();
      });
    },

    handleUpdateMembers: function (members) {
      this.localGroup.members = members;
    },

    save: function () {
      if (!this.checkForm()) {
        return;
      }

      axios
        .patch("/api/group/" + this.localGroup.id, this.localGroup)
        .then(({ data }) => {
          if (data.success) {
            this.$emit("update:reload");
          }
          this.$emit("update:editing", false);
        })
        .catch((err) => {
          this.saveError = err.response.data.message;
          this.showError = true;
        });
    },
    checkForm: function () {
      this.saveError = null;

      if (!this.isValidDeptId(this.localGroup.dept_id)) {
        this.saveError = "Department ID must be a number";
        this.showError = true;
        return false;
      }

      for (var member of this.localGroup.members) {
        if (!member.role) {
          this.saveError = "Every member must have a role assigned";
          this.showError = true;
          return false;
        }
      }

      for (let artifact of this.localGroup.artifacts) {
        if (!artifact.label || !isValidUrl(artifact.target)) {
          this.saveError = "Every artifact must have a label and valid URL";
          this.showError = true;
          return false;
        }
      }

      if (this.localGroup.group_type == null) {
        this.saveError = "You must select a group type";
        this.showError = true;
        return false;
      }

      return true;
    },
    removeArtifact: function (index) {
      this.localGroup.artifacts.splice(index, 1);
    },
    addArtifact: function () {
      this.localGroup.artifacts.push({
        label: "",
        target: "",
      });
    },
    deactivate: function () {
      if (confirm("Are you sure you want to deactivate this group?")) {
        axios
          .delete("/api/group/" + this.localGroup.id)
          .then(() => {
            this.$router.push({
              name: "home",
            });
          })
          .catch((err) => {
            console.error(err);
            alert("Error deleting this group.  Hrm.");
          });
      }
    },
    lookupMember: function () {
      axios
        .post("/api/user/lookup", {
          users: this.newUserId,
        })
        .then((res) => {
          for (var user of res.data.users) {
            var newMembershipRecord = {
              group_id: this.localGroup.id,
              start_date: dayjs().format("YYYY-MM-DD"),
              end_date: null,
              user: user,
              role: this.newRole,
            };
            this.localGroup.members.push(newMembershipRecord);
          }

          if (res.data.status == "Partial") {
            this.addMemberError = res.data.message;
          } else {
            this.newUserId = null;
            this.newUserLookupText = "";
            this.addMember = false;
          }
        })
        .catch((err) => {
          this.addMemberError = err.response.data.message;
        });
    },
  },
};
</script>

<style scoped>
.row {
  margin-top: 10px;
  margin-bottom: 10px;
}

button {
  margin-left: 5px;
  margin-right: 5px;
}

.deactivate {
  padding: 10px;
}
</style>
