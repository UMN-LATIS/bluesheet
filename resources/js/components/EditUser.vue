<template>

    <div>
         <div class="row">
      <div class="col-md-12">
        <button class="btn btn-success float-right" @click="save">Save</button>
        <button class="btn btn-outline-primary float-right" @click="$emit('update:editing', false);">Cancel Editing</button>
    
      </div>
    </div>
        <h1>{{ user.displayName }}</h1>
         <div class="form-check">
          <label class="form-check-label" for="privateGroup">
            Site Permissions
          </label>
          <select class="form-control col-md-2" v-model="user.site_permissions" id="sitePermissions">
            <option value="100">User</option>
            <option value="300">Administrator</option>
          </select>

          
        </div>
      
    </div>
</template>

<script>
    export default {
        props: ['user', 'userperms'],
        data() {
            return {
            
            }
        },
        computed: {
            usernameOnly: function() {
                return this.user.email.split("@").shift();
            }
        },
        mounted() {
        },
        methods: {
            save: function() {
                 axios.patch("/api/user/" + this.user.id, this.user)
                  .then(({data}) => {
                    this.$emit('update:editing', false); 
                  })
                  .catch(err => {
                  });
            }
            
        }
    }
</script>
