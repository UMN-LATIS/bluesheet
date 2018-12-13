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
        <button class="btn btn-success float-right" @click="save">Save</button>
        <button class="btn btn-outline-primary float-right" @click="$emit('update:editing', false); $emit('update:reload')">Cancel Editing</button>
        
        <input class="form-control col-md-8" type="text" v-model="group.group_title">
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <div class="form-check d-none">
          <input class="form-check-input" type="checkbox" v-model="group.private_group" id="privateGroup">
          <label class="form-check-label" for="privateGroup">
            Private Group
          </label>
        </div>

        <div class="row">
          <div class="col-md-12">
            <p>Group Notes:</p>
            <textarea class="form-control" v-model="group.notes"></textarea>
          </div>
        </div>
    
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
    <members :members.sync="group.members" editing="true"></members>
    <modal :show="addMember" @close="addMember = !addMember">
      <div class="form-group row">
        <label for="internetId" class="col-sm-3 col-form-label">Internet ID:</label>
        <div class="col-sm-6">
          <input type="text" ref="addMemberRef" class="form-control" id="internetId" v-on:keyup="addMemberError = null" @keyup.enter="lookupMember" placeholder="Internet ID" v-model="newUserId">
          <small id="addUserHelpBlock" class="form-text text-muted">
  Comma separated list of InternetIds or email addresses works too.
</small>
        </div>
        <div class="col-sm-3">
         <button class="btn btn-primary" @click="lookupMember">Add Member</button>
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

</style>

<script>
export default {
  props: ['group'],
  data() {
    return {
      addMember:false,
      newUserId: null,
      addMemberError: null,
      showError: false,
      saveError: null
    }
  },
  mounted() {

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
  methods: {
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

      return true;

    },
    removeArtifact: function (index) {
      this.group.artifacts.splice(index, 1);
    },
    addArtifact: function() {
     this.group.artifacts.push({label: "", target:""});
   },
   lookupMember: function() {
    axios.post("/api/user/lookup/",  {users: this.newUserId})
    .then(res => {
        for(var user of res.data.users) {
          var newMembershipRecord = { group_id: this.group.id, start_date: this.$moment().format("YYYY-MM-DD hh:mm:ss"), end_date: null, user: user};
          this.group.members.push(newMembershipRecord);  
        }
        
        
        
        if(res.data.status == "Partial") {
          this.addMemberError = res.data.message;
        }
        else {
          this.newUserId = null;
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
