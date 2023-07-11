<template>
    <div>
        <h3>Leaves</h3>
        <div class="btn btn-primary" v-if="$can('edit leaves')" @click="edit = !edit">Edit</div>
        <view-leaves v-if="!edit" :leaves="leaves"></view-leaves>
        <edit-leaves v-if="edit" :leaves="leaves"></edit-leaves>
    </div>
</template>

<script>
    export default {
        props: ['leaves'],
        data() {
            return {
                'edit': false
            }
        },
        mounted() {
        },
        methods: {
            
        }
    }
</script>