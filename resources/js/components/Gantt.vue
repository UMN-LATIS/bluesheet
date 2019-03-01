<template>
        <tbody>
            <tr>
                <th width=20%></th>
                <th colspan=5 width=80%><span>{{ mindate | moment("YYYY-MM-DD") }}</span>
                <span class="float-right">
                    {{ maxdate | moment("YYYY-MM-DD")}}
                    </span>
                </th>
            </tr>
            <gantt-row :key="member.id" v-for="member in members" :member="member" :mindate="mindate" :maxdate="maxdate"></gantt-row>

            <tr>
                <th width=20%></th>
                <th colspan="5" width=80%><span>{{ mindate | moment("YYYY-MM-DD") }}</span>
                <span class="float-right">
                    {{ maxdate | moment("YYYY-MM-DD")}}
                    </span>
                </th>
            </tr>
        </tbody>

</template>

<script>
export default {
    props: ['members', 'mindate','maxdate'],
    data() {
        return {
        }
    },
  
}
</script>

<style scoped>

tbody tr {
    border-top:1px solid lightgray;
    border-bottom:1px solid lightgray;
    line-height:2em;
}


</style>