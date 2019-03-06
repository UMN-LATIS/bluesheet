<template>
    <div>
        <header class="app-header">
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark" v-if="userperms > 0">
                <a class="navbar-brand" href="#">Groups</a>
              <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav mr-auto">
                  <li class="nav-item">
                    <router-link :to="{ name: 'user' }" class="nav-link">My Groups <i class="fas fa-user"></i></router-link>
                   </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" @click.prevent="createGroup = true">Create Group <i class="fas fa-plus"></i></a>
                </li>
                <li class="nav-item">
                    <router-link :to="{ name: 'groupList' }" class="nav-link" v-if="isAdmin">Browse Groups <i class="fas fa-search"></i></router-link>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" @click.prevent="findUser=true" v-if="isAdmin">User Lookup <i class="fas fa-users"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="https://umn-latis.github.io/Caligari/" >Help <i class="fas fa-question-circle"></i></a>
                </li>
                
        </ul>
        <ul class="navbar-nav">
            <li class="nav-item">
                <a href="/shibboleth-logout" class="nav-link">Logout</a>
            </li>
        </ul>
    </div>
</nav>
</header>
    <div class="container">
        <router-view :userperms="userperms" :key="$route.fullPath"></router-view>
    </div>

    

    <userlookup v-if="findUser" :show="findUser" @close="findUser = false"></userlookup>
    <creategroup v-if="createGroup" :show="createGroup" @close="createGroup = false"></creategroup>
</div>
</template>

<style>

.container {
    margin-top: 10px;
}

.router-link-exact-active {
    color: white !important;
}

</style>

<script>
    export default {
        props: ["userperms"],
        data() {
            return {
                findUser: false,
                createGroup: false,
            }
        },
        computed: {
            isAdmin: function() {
                return this.userperms >= 200;
            }
        },
        methods: {

        },
        mounted() {
            console.log('Component mounted.')
        }
    }
</script>
