<template>
        <tbody>
            <tr>
                <th width=20%></th>
                <th colspan=6 width=80%><span>{{ mindate | moment("YYYY-MM-DD") }}</span>
                <span class="float-right">
                    {{ maxdate | moment("YYYY-MM-DD")}}
                    </span>
                </th>
            </tr>
            <gantt-row :show_unit="show_unit" :key="member.id" v-for="member in members" :member="member" :mindate="mindate" :maxdate="maxdate"></gantt-row>

            <tr>
                <th width=20%></th>
                <th colspan="6" width=80%><span>{{ mindate | moment("YYYY-MM-DD") }}</span>
                <span class="float-right">
                    {{ maxdate | moment("YYYY-MM-DD")}}
                    </span>
                </th>
            </tr>
        </tbody>

</template>

<script>
export default {
    props: ['members', 'mindate','maxdate', 'show_unit'],
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