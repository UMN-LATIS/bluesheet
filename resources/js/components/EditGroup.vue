<template>
  <div>
    <Modal :show="showError" @close="showError = !error">
      <div v-if="saveError" class="alert alert-danger col-sm-12" role="alert">
        {{ saveError }}
      </div>
      <button class="btn btn-primary" @click="showError = false">Close</button>
    </Modal>

    <header
      class="tw-sticky tw-top-0 tw-z-10 tw-bg-white/10 tw-backdrop-blur-sm tw-py-4 tw-mb-4 -tw-mx-4 tw-px-4"
    >
      <h3 class="tw-text-sm tw-uppercase tw-mb-2 tw-mt-0 tw-text-neutral-500">
        Edit Group
      </h3>
      <div class="sm:tw-flex tw-justify-between tw-items-baseline">
        <h2 class="tw-text-xl sm:tw-text-2xl md:tw-text-3xl">
          {{ localGroup.group_title || "My Group" }}
          <span v-if="localGroup.abbreviation">
            ({{ localGroup.abbreviation }})
          </span>
        </h2>

        <div class="tw-flex tw-gap-1">
          <ButtonComponent
            class="!tw-m-0"
            @click="
              $emit('update:editing', false);
              $emit('update:reload');
            "
          >
            Cancel
          </ButtonComponent>
          <ButtonComponent
            variant="primary"
            class="tw-bg-green-500 tw-border-green-500 hover:tw-bg-green-600 hover:tw-border-green-600 !tw-m-0"
            @click="save"
            >Save</ButtonComponent
          >
        </div>
      </div>
    </header>

    <div
      class="tw-grid md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-8 tw-items-start"
    >
      <section
        class="lg:tw-col-span-2 tw-grid lg:tw-grid-cols-4 tw-gap-x-4 tw-items-start"
      >
        <div class="form-group tw-col-span-2">
          <label for="groupTitle" class="small">Group Title</label>
          <input
            id="groupTitle"
            v-model="localGroup.group_title"
            class="form-control"
            type="text"
          />
        </div>
        <div class="form-group">
          <label for="abbreviation" class="small">Abbreviation</label>
          <input
            id="abbreviation"
            v-model="localGroup.abbreviation"
            class="form-control"
          />
        </div>
        <InputGroup
          v-model="localGroup.dept_id"
          label="Department ID"
          :showLabel="true"
          class="tw-flex-1 form-group"
          :validator="isValidDeptId"
          :validateWhenUntouched="true"
          errorText="Must be a number"
          labelClass="!tw-text-sm tw-normal-case tw-mb-2 tw-text-neutral-800"
          inputClass="!tw-text-base"
        />
        <div class="form-group tw-col-span-2">
          <label for="groupType" class="small">Group Type</label>
          <ComboBox
            v-if="groupTypes"
            id="groupTypes"
            v-model="localGroup.group_type"
            :options="groupTypes"
            placeholder="Select..."
            label="Group Type"
            :showLabel="false"
            :canAddNewOptions="true"
            @addNewOption="groupTypes.push($event)"
          />
        </div>

        <div class="form-group tw-col-span-2">
          <label for="parentOrganization" class="small">Folder</label>
          <FolderWidget
            v-model="localGroup.parent_organization.id"
          ></FolderWidget>
        </div>
        <div class="form-group tw-col-span-2">
          <label for="parentGroup" class="small">Parent Group</label>
          <ComboBox
            v-if="groups"
            id="groups"
            :modelValue="parentGroup"
            :options="parentGroupOptions"
            placeholder="Select..."
            label="Parent Group"
            :showLabel="false"
            @update:modelValue="handleUpdateParentGroup"
          />
        </div>

        <div class="form-group tw-col-span-2">
          <label for="googleGroup" class="small">Google Group Name</label>
          <input
            id="googleGroup"
            v-model="localGroup.google_group"
            class="form-control"
          />
        </div>

        <div class="form-check">
          <input
            id="showunit"
            v-model="localGroup.show_unit"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label small" for="showunit">
            Show Unit Column in Members List
          </label>
        </div>
        <div class="form-check">
          <input
            id="includechildgroups"
            v-model="localGroup.include_child_groups"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label small" for="includechildgroups">
            Include Subgroup Members in Members List
          </label>
        </div>
      </section>
      <aside class="tw-bg-neutral-100 tw-p-4 tw-rounded-md tw-w-full">
        <h2
          class="tw-inline-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-mb-4"
        >
          Group Details
        </h2>

        <div class="form-group">
          <LabelComponent for="groupNotes" class="tw-text-neutral-900"
            >Notes</LabelComponent
          >
          <textarea
            id="groupNotes"
            v-model="localGroup.notes"
            class="form-control"
          ></textarea>
        </div>

        <section data-cy="group-artifacts-section" class="tw-mt-4">
          <header class="tw-flex tw-justify-between tw-items-baseline">
            <h3 class="tw-text-xs tw-uppercase tw-m-0">Artifacts</h3>
            <ButtonComponent variant="tertiary" @click="addArtifact">
              Add Artifact <i class="fas fa-plus tw-m-0"></i>
            </ButtonComponent>
          </header>
          <p class="tw-text-sm tw-italic tw-mb-2 tw-text-neutral-500">
            Artifacts are links to documents or web pages that are relevant to
            this group.
          </p>

          <div
            v-for="(artifact, key) in localGroup.artifacts"
            :key="key"
            class="tw-flex tw-items-baseline tw-gap-2"
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
              errorText="URL must be like 'https://umn.edu'"
              data-cy="artifact-target"
            />
            <ButtonComponent
              variant="tertiary"
              class="tw-text-red-600 hover:!tw-bg-red-600/10"
              @click="removeArtifact(key)"
            >
              <XIcon />
              <span class="sr-only">Remove Artifact</span>
            </ButtonComponent>
          </div>
        </section>
      </aside>
    </div>

    <section
      class="tw-mt-12 tw-border-0 tw-border-t tw-border-solid tw-border-neutral-200 tw-pt-8"
    >
      <header class="tw-flex tw-justify-between tw-items-baseline tw-mb-4">
        <h2 class="tw-text-xl">Members</h2>
        <ButtonComponent variant="secondary" @click="addMember = true">
          Add Member <i class="fas fa-plus tw-m-0"></i>
        </ButtonComponent>
      </header>
      <Members
        v-model:members="localGroup.members"
        :groupType="localGroup.group_type.label"
        :show_unit="localGroup.show_unit"
        :editing="true"
        :roles="filteredRoles"
        viewType="group"
        :downloadTitle="localGroup.group_title"
        :group="group"
        @update:members="handleUpdateMembers"
        @update:roles="(updatedRoles) => (roles = updatedRoles)"
      ></Members>
    </section>

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
            label="Role"
            :showLabel="false"
            :canAddNewOption="true"
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
import { ComboBox } from "./ComboBox";
import Members from "./Members.vue";
import Modal from "./Modal.vue";
import FolderWidget from "./FolderWidget.vue";
import PersonSearch from "./PersonSearch.vue";
import { dayjs, axios, isValidUrl, doesGroupHaveSubgroup } from "@/utils";
import InputGroup from "./InputGroup.vue";
import ButtonComponent from "./Button.vue";
import { XIcon } from "@/icons";
import LabelComponent from "./Label.vue";

export default {
  components: {
    Members,
    Modal,
    FolderWidget,
    PersonSearch,
    ComboBox,
    InputGroup,
    ButtonComponent,
    LabelComponent,
    XIcon,
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
      if (!this.groups?.length || !this.localGroup) {
        return null;
      }

      return (
        this.parentGroupOptions.find(
          (group) => group.id == this.localGroup.parent_group_id,
        ) ?? null
      );
    },
    parentGroupOptions() {
      if (!this.groups || !this.localGroup) return [];

      const parentGroupOptions = this.groups
        .filter((group) => {
          if (!group.canCurrentUser) {
            throw new Error(`Group ${group.id} has no canCurrentUser property`);
          }
          // if this is the current saved parent group
          // permit it to remain selected
          if (group.id == this.group?.parent_group_id) {
            return true;
          }

          return (
            // the group is not the current group
            group.id != this.localGroup.id &&
            // the current user can update the group
            group.canCurrentUser.update &&
            // if the group is not a subgroup of the current group (to prevent circular references)
            !doesGroupHaveSubgroup(this.group, group)
          );
        })
        .map((group) => ({
          id: group.id,
          label: group.group_title,
        }))
        .toSorted((a, b) => a.label.localeCompare(b.label));

      // prepend a null option for "no parent group"
      return [{ id: null, label: "-- None --" }, ...parentGroupOptions];
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
        this.groups = res.data.filter(
          (g) => g.active_group && g.id != this.localGroup.id,
        );
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
