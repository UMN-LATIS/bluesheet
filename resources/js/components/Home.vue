<template>
    <div>
        <div class="region--masthead-fourth--wrapper">
        
<div class="region region--masthead-fourth clearfix" id="masthead-fourth">
                <div class="region__inner">

                    <nav role="navigation" aria-labelledby="block-groupmenus-menu" id="block-groupmenus"
                        data-block-plugin-id="groupmenus"
                        class="block block-menu navigation header-menu groupmenu--header-menu">

                        <h2 class="visually-hidden" id="block-groupmenus-menu">Group Navigation</h2>



                        <div class="header-menu--toggle">
                            <span class="header-menu--toggle--label">Menu</span>
                            <svg class="svg-inline--fa fa-bars fa-w-14 header-menu--toggle--accent" aria-hidden="true"
                                focusable="false" data-prefix="fas" data-icon="bars" role="img"
                                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg="">
                                <path fill="currentColor"
                                    d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z">
                                </path>
                            </svg><!-- <span class="header-menu--toggle--accent fas fa-bars"></span> -->
                        </div>

                        <div class="header-menu--menu-wrapper">

                            <ul class="menu menu-level--1">

    <li class="menu-item menu-item--level-1" id="v-step-1">
                            <router-link :to="{ name: 'home' }" class="nav-link">
                                <span> Home <i class="fas fa-home"></i></span>
                            </router-link>
                        </li>

                        <li class="menu-item menu-item--level-1" id="v-step-1">
                            <router-link :to="{ name: 'user' }" class="nav-link">
                                <span> My Groups <i class="fas fa-user"></i></span>
                            </router-link>
                        </li>
                        <li class="menu-item menu-item--collapsed menu-item--level-1" v-if="$can('create groups')">
                            <a class="nav-link" href="#" @click.prevent="createGroup = true" ><span>Create Group <i class="fas fa-plus"></i></span></a>
                        </li>
                        <li class="menu-item menu-item--collapsed menu-item--level-1" id="v-step-6" v-if="$can('view groups')">
                            <router-link :to="{ name: 'groupList' }" class="nav-link" ><span>Browse Groups <i class="fas fa-search"></i></span></router-link>
                        </li>
                        <li class="menu-item menu-item--collapsed menu-item--level-1" id="v-step-7" v-if="$can('view groups')">
                            <router-link :to="{ name: 'roleList' }" class="nav-link" ><span>Browse Roles <i class="fas fa-search"></i></span></router-link>
                        </li>
                        <li class="menu-item menu-item--collapsed menu-item--level-1" v-if="$can('view reports')">
                            <router-link :to="{ name: 'reportList' }" class="nav-link" ><span> View Reports <i class="fas fa-table"></i></span></router-link>
                        </li>
                        <li class="menu-item menu-item--collapsed menu-item--level-1" v-if="$can('view users')">
                            <a class="nav-link" href="#" @click.prevent="findUser=true" ><span>User Lookup <i class="fas fa-users"></i></span></a>
                        </li>
                        <li class="menu-item menu-item--collapsed menu-item--level-1" id="v-step-8">
                            <a class="nav-link" href="https://umn-latis.github.io/Caligari/" target="_blank"><span>Help <i
                                    class="fas fa-question-circle"></i></span></a>
                        </li>

                    </ul>
               
                        </div>

                    </nav>
                </div>
            </div>
</div>

<div class="layout-background--maroon-gradient layout--full-width layout layout-container layout--onecol">
        <div class="container">
            <div class="layout-white-box layout--narrow layout layout-container layout--onecol">
            <div class="layout__region layout__region--content region-full">
    <div data-block-plugin-id="entity_view:group" class="block block-ctools block-entity-view--group">

            <router-view :userperms="userperms" :key="$route.fullPath"></router-view>
    </div>
    </div>
        </div>
</div>
</div>


        <userlookup v-if="findUser" :show="findUser" @close="findUser = false"></userlookup>
        <creategroup v-if="createGroup" :show="createGroup" @close="createGroup = false"></creategroup>
        <v-tour name="intro_tour" :steps="steps"></v-tour>
    </div>
</template>

<style>
    .container {
        margin-top: 10px;
    }

    .router-link-active {
        color: black !important;
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
