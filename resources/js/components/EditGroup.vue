<template>
  <div>
    <modal :show="showError" @close="showError = !error">
      <div class="alert alert-danger col-sm-12" role="alert" v-if="saveError">
        {{ saveError }}
      </div>
      <button class="btn btn-primary" @click="showError=false">Close</button>
    </modal>
    <div class="row">
      <div class="col-md-12">

        <div class="form-group row">

          <div class="col-sm-6">
             <div class="form-group">
              <label for="groupTitle" class="small">Group Title</label>
              <input  id="groupTitle" class="form-control" type="text" v-model="group.group_title">
            </div>
          </div>
           <div class="col-sm-3">
             <div class="form-group">
              <label for="abbreviation" class="small">Abbreviation</label>
              <input id="abbreviation" class="form-control" v-model="group.abbreviation">
            </div>
          </div>
          <div class="col-sm-3">
            <button class="btn btn-success float-right" @click="save">Save</button>
            <button class="btn btn-outline-primary float-right" @click="$emit('update:editing', false); $emit('update:reload')">Cancel Editing</button>
          </div>
        </div>
        <div class="row">

          <div class="col-sm-4">
            <div class="form-group">
              <label for="groupType" class="small">Group Type</label>
              <v-select v-if="groupTypes" id="roles" taggable v-model="group.group_type" :options="groupTypes"></v-select>
            </div>
          </div>

          <div class="col-sm-4">
            <div class="form-group">
              <label for="parentOrganization" class="small">Folder</label>
              <treeselect v-model="group.parent_organization.id" :multiple="false" :options="parentOrganizations"  :clearable="false" :searchable="true" :open-on-click="true" :close-on-select="true" label="group_title" v-if="parentOrganizations" />
            </div>
          </div>
           <div class="col-sm-4">
            <div class="form-group">
              <label for="parentGroup" class="small">Parent Group</label>
              <v-select v-if="groups" id="roles" v-model="group.parent_group_id" :options="groups" :reduce="parent_group => parent_group.id"></v-select>
            </div>
          </div>
        </div>
        
        
        <div class="row">
          <div class="col-md-6">
            <label for="googleGroup" class="small">Google Group Name</label>
            <input id="googleGroup" class="form-control" v-model="group.google_group">
          </div>

        </div>
         <!-- <div class="row">
          <div class="col-md-6">
            <label for="groupURL" class="small">Public Group URL</label>
            <input id="groupURL" class="form-control" @click="$event.target.select()" :value="groupURL">
            <label class="form-check-label small" for="groupURL">
                This URL will allow the group to be viewed without logging in.
              </label>
          </div> -->
        <!-- </div> -->
        
        <div class="row">
          <!-- <div class="col-md-6">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="group.private_group" id="privateGroup">
              <label class="form-check-label small" for="privateGroup">
                Private Group
              </label>
            </div>
          </div> -->
          <div class="col-md-6">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="group.show_unit" id="showunit">
              <label class="form-check-label small" for="showunit">
                Show Unit
              </label>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <label for="groupNotes" class="small">Group Notes</label>
            <textarea id="groupNotes" class="form-control" v-model="group.notes"></textarea>
          </div>
        </div>



      </div>
    </div>
    <div class="row">
      <div class="col-md-12">


        <div class="row">
          <div class="col-md-12">
            <button class="btn btn-outline-primary float-right" @click="addArtifact">Add Artifact <i class="fas fa-plus"></i></button>
            <p>Artifacts:</p> 
          </div>
        </div>
        <div class="form-row" v-for="(artifact, key) in group.artifacts">

          <div class="form-group col-md-5">
            <input type="" v-model="artifact.label" class="form-control" placeholder="Label">
          </div>
          <div class="form-group col-md-6">
            <input  v-model="artifact.target" class="form-control" placeholder="Target URL">
          </div>
          <div class="form-group col-md-1 d-flex flex-column">

            <button class="btn btn-danger" @click="removeArtifact(key)"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>
      </div>
    </div>
    <div class="row">


      <div class="col-md-12">
        <button class="btn btn-outline-primary float-right" @click="addMember=true">Add Member <i class="fas fa-plus"></i></button>
        <p>Members:</p> 
      </div>
    </div>
    <members :groupType="group.group_type.label" :members.sync="group.members" :show_unit="group.show_unit" editing="true" :roles="roles" :userperms='userperms' viewType="group" :downloadTitle="group.group_title"></members>


    <div class="row border border-danger rounded deactivate">
      <div class="col-sm-12">
        <strong>If you deactivate this group, all members will be removed and an administrator will be required to reactivate it.</strong>
        <button class="btn btn-danger float-right" @click="deactivate">Deactivate Group</button>
      </div>
    </div>


    <modal :show="addMember" @close="addMember = !addMember">
      <div class="row">
          <label for="nameLookup" class="col-sm-3 col-form-label">Name:</label>
          <div class="col-sm-6">
          <autocomplete
            source="/api/autocompleter/user?searchType=nameAndInternetId&q="
            id="nameLookup"
            results-property="items"
            results-display="full_name"
            results-value="mail"
            ref="userAutocompleter"
            input-class="form-control"
            v-model="newUserId"
            >
          </autocomplete>
          <small id="addUserHelpBlock" class="form-text text-muted">
            Optional: Enter a name and select the person from the list
          </small>
      </div>
      </div>

      
      <div class="row">
          <label for="internetId" class="col-sm-3 col-form-label">Internet ID:</label>
          <div class="col-sm-6">
          <input type="text" ref="addMemberRef" class="form-control" id="internetId" v-on:keyup="addMemberError = null" @keyup.enter="lookupMember" placeholder="Internet ID" v-model="newUserId">
          <small id="addUserHelpBlock" class="form-text text-muted">
            Enter one or more InternetIds or email addresses (comma-seperated). You can add a list of users, even if it's in the format "John Smith &lt;smith@umn.edu&gt;, Jane Doe &lt;jane@umn.edu&gt;".
          </small>
        </div>
      </div>
      <div class="row">

        <label for="roles" class="col-sm-3 col-form-label">Role:</label>
        <div class="col-sm-6">
          <v-select v-if="roles" id="roles" taggable v-model="newRole" :options="roles"></v-select>
        </div>
        <div class="col-sm-3">
          <button class="btn btn-primary" style="white-space:nowrap;" @click="lookupMember">Add Member</button>
        </div>

      </div>
      <div class="row">
        <div class="alert alert-danger col-sm-12" role="alert" v-if="addMemberError">
          {{ addMemberError }}
        </div>

      </div>


    </modal>

  </div>

</template>

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

<script>
  export default {
    props: ['group', 'userperms'],
    data() {
      return {
        addMember:false,
        newUserId: null,
        newRole: null,
        addMemberError: null,
        showError: false,
        saveError: null,
        roles: null,
        groupTypes: null,
        parentOrganizations: null,
        groups: null
      }
    },
    mounted() {
      axios.get("/api/group/roles/")
      .then(res => {
        this.roles = res.data;
      })
      .catch(err => {
        this.error = err.response.data;
      });
      axios.get("/api/group/types")
      .then(res => {
        this.groupTypes = res.data;
        if(this.groupTypes.filter(e => e.id == this.group.group_type.id).length == 0) {
          this.groupTypes.push(this.group.group_type);
        }
        
      })
      .catch(err => {

      });
      axios.get("/api/group/parents")
      .then(res => {
        this.parentOrganizations = this.remapParents(res.data);
      })
      .catch(err => {

      });
      axios.get("/api/group")
      .then(res => {
        this.groups = res.data.filter(e=> e.active).filter(e=>e.id != this.group.id).map(e => { return {id: e.id, label: e.group_title}});
      })
      .catch(err => {

      });
    },
    watch: {
      addMember: function (newVal, oldVal) {
        if(newVal == true) {
          this.$nextTick(() => {
           this.$refs.addMemberRef.focus();
         });
        }
      }
    },
    computed: {
      groupURL: function() {
        return window.location.protocol + "//" + window.location.hostname +(window.location.port ? ':'+window.location.port: '') + "/group/" + this.group.id + "/" + this.group.secret_hash;
      }
    },
    methods: {
      remapParents: function(p) {
        return p.map(org => { var result = {"id": org.id, "label": org.group_title }; if(org.child_organizations_recursive.length > 0) { result.children = this.remapParents(org.child_organizations_recursive)}; return result; });
      },
      save: function() {
        if(!this.checkForm()) {
          return;
        }

        axios.patch("/api/group/" + this.group.id, this.group)
        .then(({data}) => {
          if(data.success) {
            this.$emit('update:reload')
          }
          this.$emit('update:editing', false); 
        })
        .catch(err => {
          this.saveError = err.response.data.message;
          this.showError = true;
        });
      },
      checkForm: function() {
        this.saveError = null;

        for(var member of this.group.members) {
          if(!member.role) {
            this.saveError = "Every member must have a role assigned";
            this.showError = true;
            return false;
          }
        }

        if(this.group.group_type == null) {
          this.saveError = "You must select a group type";
          this.showError = true;
          return false;
        }

        return true;

      },
      removeArtifact: function (index) {
        this.group.artifacts.splice(index, 1);
      },
      addArtifact: function() {
       this.group.artifacts.push({label: "", target:""});
     },
     deactivate: function() {
      if(confirm("Are you sure you want to deactivate this group?")) {

        axios.delete("/api/group/" + this.group.id)
        .then(res => {
          this.$router.push({ name: 'home'});
        })
        .catch(err => {
          alert("Error deleting this group.  Hrm.");
        })

      }
    },
    lookupMember: function() {
      axios.post("/api/user/lookup",  {users: this.newUserId})
      .then(res => {
        for(var user of res.data.users) {
          var newMembershipRecord = { group_id: this.group.id, start_date: this.$moment().format("YYYY-MM-DD"), end_date: null, user: user, role: this.newRole};
          this.group.members.push(newMembershipRecord);  
        }
        
        
        
        if(res.data.status == "Partial") {
          this.addMemberError = res.data.message;
        }
        else {
          this.newUserId = null;
          this.$refs.userAutocompleter.display = "";
          this.addMember = false;
        }
        // this.group = res.data;
      })
      .catch(err => {
        this.addMemberError = err.response.data.message;
      });

    }

  }
}
</script>
