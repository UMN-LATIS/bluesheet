<template>
    <modal :show="show" @close="close">
        <div class="row">
          <label for="nameLookup" class="col-sm-3 col-form-label">Name:</label>
          <div class="col-sm-6">
          <AutoComplete
            source="/api/autocompleter/user?searchType=nameAndInternetId&q="
            id="nameLookup"
            resultsProperty="items"
            resultsDisplay="full_name"
            resultsValue="mail"
            ref="userAutocompleter"
            inputClass="form-control"
            v-model="userLookupId"
            />
          <small id="addUserHelpBlock" class="form-text text-muted">
            Optional: Enter a name and select the person from the list. For common names, we recommend using internet ID (below) to be sure you get the right person.
          </small>
      </div>
      </div>


      <div class="row">
          <label for="internetId" class="col-sm-3 col-form-label">Internet ID:</label>
          <div class="col-sm-6">
          <input type="text" ref="addMemberRef" class="form-control" id="internetId" v-on:keyup="addMemberError = null" @keyup.enter="lookupUser" placeholder="Internet ID" v-model="userLookupId">
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
            <div class="alert alert-danger col-sm-12" role="alert" v-if="findUserError">
                {{ findUserError }}
            </div>

        </div>

    </modal>
</template>

<script>
import Modal from './Modal.vue';
import AutoComplete from "vuejs-auto-complete";

    export default {
        props: ['show'],
        components: {
            Modal,
            AutoComplete,
        },
        data() {
            return {
                findUserError: null,
                userLookupId: null,
            }
        },
        watch: {
            show: function(newVal) {
                if(newVal) {
                    this.$nextTick(() => {
                        this.$refs.findMemberRef.focus();
                    });
                }
            }
        },
        methods: {
            close: function () {
                this.userLookupId = null;
                this.$emit('close');
            },
            lookupUser: function() {
                axios.post("/api/user/lookup", {users:this.userLookupId})
                .then(res => {
                   if(res.data.users.length == 1) {
                        this.$router.push({ name: 'user', params: {'userId': res.data.users[0].id}});
                        this.close();
                   }
                   else {
                        this.$router.push({ name: 'userList', query: {'users': res.data.users.map(u=> u.id)}});
                        this.close();
                   }
                })
                .catch(err => {
                    this.findUserError = err.response.data.message;
                });

            }
        }
    }
</script>
