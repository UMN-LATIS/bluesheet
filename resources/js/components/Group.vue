<template>
    <div class="container">
        <div class="alert alert-danger" role="alert" v-if="error">
            {{ error}}
        </div>
        <button class="btn btn-outline-primary float-right" @click="editing=!editing">Edit Group</button>
        <viewgroup :group="group" v-if="!editing && group">
        </viewgroup>
        <editgroup :group="group" v-if="editing && group">
        </editgroup>
        <members :members="members" ></members>
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
        computed: {
            members: function() {
                if(this.group) {
                    return this.group.members;    
                }
                return [];
            }
        },
        methods: {
            loadGroup() {
                this.error = null;
                
                axios.get("/api/group/" + this.groupId)
                .then(res => {
                    this.group = res.data;
                })
                .catch(err => {
                    this.error = err.response.data;
                });

            }
        }
    }
</script>
