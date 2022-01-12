<template>

    <body>
        <app-header>
            <template #app-link><a href="/">BlueSheet</a></template>
            <template #navbar-links>
                <navbar-item>
                    <router-link :to="{ name: 'user' }" class="nav-link">My Groups <i class="fas fa-user"></i>
                    </router-link>
                </navbar-item>
                <navbar-item>
                    <a class="nav-link" href="#" @click.prevent="createGroup = true" v-if="$can('create groups')">Create
                        Group <i class="fas fa-plus"></i></a>
                </navbar-item>
                <navbar-item>
                    <router-link :to="{ name: 'groupList' }" class="nav-link" v-if="$can('view groups')">Browse
                        Groups <i class="fas fa-search"></i></router-link>
                </navbar-item>
                <navbar-item>
                    <router-link :to="{ name: 'roleList' }" class="nav-link" v-if="$can('view groups')">Browse
                        Roles <i class="fas fa-search"></i></router-link>
                </navbar-item>
                <navbar-item>
                    <router-link :to="{ name: 'reportList' }" class="nav-link" v-if="$can('view reports')">View
                        Reports <i class="fas fa-table"></i></router-link>
                </navbar-item>
                <navbar-item>
                    <a class="nav-link" href="#" @click.prevent="findUser=true" v-if="$can('view users')">User
                        Lookup <i class="fas fa-users"></i></a>
                </navbar-item>
                <navbar-item>
                    <a class="nav-link" href="https://umn-latis.github.io/Caligari/" target="_blank">Help <i
                            class="fas fa-question-circle"></i></a>
                </navbar-item>
                <navbar-item>
                            <a href="/shibboleth-logout" class="nav-link">Logout</a>
                        </navbar-item>

            </template>
        </app-header>
        
        <postit class="container">
            <router-view :userperms="userperms" :key="$route.fullPath"></router-view>
        </postit>

        <app-footer/>

        <userlookup v-if="findUser" :show="findUser" @close="findUser = false"></userlookup>
        <creategroup v-if="createGroup" :show="createGroup" @close="createGroup = false"></creategroup>
        <v-tour name="intro_tour" :steps="steps"></v-tour>
    </body>
</template>

<style>
    /* .container {
        margin-top: 10px;
    } */

    .router-link-active {
        color: black !important;
    }

    .fas {
        margin-left: 5px;
        margin-top: 3px;
    }
</style>

<script>
    export default {
        props: ["userperms"],
        data() {
            return {
                findUser: false,
                createGroup: false,
                steps: [{
                        target: '#v-step-0', // We're using document.querySelector() under the hood
                        header: {
                            title: 'Welcome to the BlueSheet Tool',
                        },
                        content: `Discover the <strong>BlueSheet Tool</strong> with this quick tour. <br/> We'll show you the basics, and you can always reach out for assistance.`
                    },
                    {
                        target: '#v-step-1',
                        content: `Right now, you're on the home page. This gives you quick access to some common needs.`
                    },
                    {
                        target: '#v-step-4',
                        content: `The BlueSheet Tool is used to keep track of the membership of groups, committees, and departments. This includes both the people involved and their roles. If someone has two roles within a group, they'll have two entries in the list.`
                    },
                    {
                        target: '#pastRoles',
                        content: 'One of the powerful features of the BlueSheet Tool is that it keeps track of any previous group memberships as well. As you use the tool, this checkbox will let you view historical data.',
                    },
                    {
                        target: '#v-step-6',
                        content: `You can browse all of the available groups using this tab. Groups are organized into folders, but you'll also be able to search for a specific group. You can favorite groups that you use often, and they'll apear on your "My Groups" page.`,
                    },
                    {
                        target: '#v-step-7',
                        content: `The "Browse Roles" tab allows you to see all of the people who hold a given role. This can be useful for answering questions like "Who are all the Directors of Undergraduate Studies".`,
                    },
                    {
                        target: '#v-step-8',
                        content: `If you've got any questions, the "Help" tab has guides, frequently asked questions, and an intro video. You can also contact us if you've got any questions.`,
                    }
                ]
            }
        },
        methods: {

        },
        mounted() {
            this.$store.dispatch('fetchUser')
            console.log('Component mounted.')
            if (window.showTour) {
                this.$tours['intro_tour'].start()
            }
        }
    }

</script>
