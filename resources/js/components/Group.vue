<template>
    <div>
        <div class="alert alert-danger" role="alert" v-if="error">
            {{ error}}
        </div>
        <viewgroup :group="group" v-if="!editing && group" v-bind:editing.sync="editing" :userperms='userperms'>
        </viewgroup>
        <editgroup :group="group" v-if="editing && group" v-bind:editing.sync="editing" v-on:update:reload="loadGroup()" >
        </editgroup>
    </div>
</template>

<script>
    export default {
        props: ['groupId', 'hash', 'userperms'],
        data() {
            return {
                error: null,
                group: null,
                editing: false
            }
        },
        mounted() {
            this.loadGroup();
        },
        methods: {
            loadGroup() {
                this.error = null;
                axios.get("/api/group/" + this.groupId + (this.hash ?('/'+ this.hash) : ''))
                .then(res => {
                    this.group = res.data;
                    Vue.set(this.group, 'members', []);
                    this.group.members = [];
                    axios.get("/api/group/" + this.groupId + "/members"+ (this.hash ?('/'+ this.hash) : ''))
                    .then(res => {
                        Vue.set(this.group, 'members', res.data);
                    })
                    .catch(err => {
                        this.error = err.response.data;
                    });
                })
                .catch(err => {
                    this.error = err.response.data;
                });

            }
        }
    }
</script>
