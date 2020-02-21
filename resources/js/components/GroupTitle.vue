<template>
    <span>
        {{ group.group_title}} <span v-if="group.abbreviation">({{ group.abbreviation }})</span>
    </span>
</template>

<script>
export default {
    props: ['group']
}
</script>