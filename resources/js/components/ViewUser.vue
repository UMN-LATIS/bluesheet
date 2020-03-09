<template>
    <div>
         <div class="row">
      <div class="col-md-12">
        <button class="btn btn-outline-primary float-right" @click="$emit('update:editing', true)">Edit</button>
      </div>
    </div>
        <h1>{{ user.displayName }}</h1>
        <ul>
            <li v-if="user.title"><strong>Title: </strong>{{user.title}}</li>
            <li v-if="user.office"><strong>Office: <br /></strong> <span v-html="formattedOffice"></span></li>
            <li v-if="user.email"><strong>Email: </strong><a v-bind:href=" `mailto:${user.email}` ">{{user.email}}</a></li>
            <li <a :href="'http://myaccount.umn.edu/lookup?CN=' + usernameOnly">Directory Entry</a></li>
        </ul>
    </div>
</template>

<style scoped>
ul {
    list-style: none;
}
ul li {
    margin-top: 5px;
    margin-bottom: 5px;
}
</style>

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
            },
            formattedOffice: function() {
                return this.user.office.replace(/ \$ /g, "<br />");
            }
        },
        mounted() {
        },
        methods: {
            
        }
    }
</script>
