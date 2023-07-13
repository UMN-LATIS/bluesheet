<template>
    <span>
        <p v-for="member in memberList" >
            <router-link :to="{ name: 'user', params: { userId: member.user.id } }">{{ member.user.displayName }}</router-link>
            <small class="text-muted d-block">{{ member.notes }}</small>
        </p>
    </span>
</template>

<script>
export default {
    props: [
        'memberList'
    ]
}
</script>