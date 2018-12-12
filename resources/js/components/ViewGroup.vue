<template>
    <div>
        <h1>{{ group.group_title }}</h1>
        <ul>
            <li v-for="artifact in group.artifacts"><a v-bind:href="artifact.target">{{ artifact.label }}</a></li>
        </ul>
    </div>
</template>

<script>
    export default {
        props: ['group'],
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
