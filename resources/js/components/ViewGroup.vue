<template>
    <div>
        <div class="row">
          <div class="col-md-12">
            <button class="btn btn-outline-primary float-right" @click="$emit('update:editing', true)">Edit Group</button>
            <h1>{{ group.group_title }}</h1>
        </div>
    </div>
    <p v-if="group.private_group"><strong>Private Group</strong></p>
    <ul>
        <li v-for="artifact in group.artifacts"><a v-bind:href="artifact.target">{{ artifact.label }}</a></li>
    </ul>
    <members :members="group.members" ></members>
</div>
</template>

<script>
export default {
    props: ['group', 'editing'],
    data() {
        return {

        }
    },
    mounted() {
    },
    methods: {

    }
}
</script>

<style scoped>
.row {
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>