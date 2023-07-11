<template>
    <div>
        <h1>Welcome to BlueSheet</h1>

        <div class="row">
            <div class="col-12 col-md-9">
                <p>BlueSheet provides easy access to information about the roles people hold, and the groups they're a
                    member of. Below are some of the most frequently accessed lists. As you browse the site, use the
                    "star" icon to flag your most commonly accessed groups and roles. They'll show up on this home
                    screen next time you log in. Check our <a href="https://umn-latis.github.io/Caligari/">help
                        guide</a> for more information, or <a href="mailto:latistecharch@umn.edu">contact us</a> to
                    arrange a personal orientation.</p>
            </div>
        </div>

        <div class="row mt-5" v-if="$store.state.user">

            <div class="col" v-if="$store.state.favorites.groups.length > 0">
                <h3>Favorite Groups</h3>
                <favorites :user="$store.state.user" type="group"></favorites>
            </div>
            <div class="col" v-if="$store.state.favorites.roles.length > 0">
                <h3>Favorite Roles</h3>
                <favorites :user="$store.state.user" type="role"></favorites>
            </div>
        </div>
        <div class="row mt-5">
            <div class="col">
                <h3>Frequently Accessed Roles</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="role in frequentRoles" :key="role.id">
                            <td>
                                <router-link :to='{ name: "role", params: { roleId: role.id } }'>{{ role.label }}
                                </router-link>
                            </td>
                        </tr>
                    </tbody>
                </table>

            </div>
        </div>

    </div>
</template>

<script>
import Favorites from '../components/Favorites.vue';

    export default {
        components: {
            Favorites
        },
        data() {
            return {
                frequentRoles: [{
                        "id": 23,
                        "label": "Academic Department Administrator"
                    },
                    {
                        "id": 22,
                        "label": "Academic Unit Chair/Director"
                    },
                    {
                        "id": 18,
                        "label": "Director of Graduate Studies"
                    },
                    {
                        "id": 21,
                        "label": "Director of Undergraduate Studies"
                    },
                    {
                        "id": 39,
                        "label": "Research and Support Center Admin"
                    }
                ]
            }
        }
    }

</script>
