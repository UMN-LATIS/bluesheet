<template>
    <div>
         <div class="row">
      <div class="col-md-12">
        <button class="btn btn-outline-primary float-right" @click="$emit('update:editing', true)">Edit</button>
      </div>
    </div>
        <h1>{{ user.displayName }}</h1>
        <ul>
            <li v-if="user.email"><a v-bind:href=" `mailto:${user.email}` ">{{user.email}}</a></li>
            <li><a :href="'http://myaccount.umn.edu/lookup?CN=' + usernameOnly">Directory Entry</a></li>
        </ul>
    </div>
</template>

<script>
    export default {
        props: ['user'],
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
            
        }
    }
</script>
