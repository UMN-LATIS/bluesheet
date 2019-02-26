<template>
    <div>
        <div class="alert alert-danger" role="alert" v-if="error">
            {{ error}}
        </div>
        <viewgroup :group="group" v-if="!editing && group" v-bind:editing.sync="editing">
        </viewgroup>
        <editgroup :group="group" v-if="editing && group" v-bind:editing.sync="editing" v-on:update:reload="loadGroup()" >
        </editgroup>
    </div>
</template>

<script>
    export default {
        props: ['groupId'],
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
                
                axios.get("/api/group/" + this.groupId)
                .then(res => {
                    this.group = res.data;
                    Vue.set(this.group, 'members', []);
                    this.group.members = [];
                    axios.get("/api/group/" + this.groupId + "/members")
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
