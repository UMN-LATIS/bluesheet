<template>
    <div>
        <h1>{{ user.displayName }}</h1>
        <ul>
            <li>{{ user.email }}</li>
            <li>{{ user.phone }}</li>
            <li>{{ user.office }}</li>
        </ul>
    </div>
</template>

<script>
    export default {
        props: ['user'],
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
