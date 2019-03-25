<template>
    <tbody>
        <tr :key="key" v-for="(member, key) in filteredList">
            <td v-if="filterList">
                <input type="checkbox" @click="member.filtered = $event.target.value?true:false">
            </td>

            <td>
                <router-link :to="{ name: 'user', params: { userId: member.user.id } }" v-if="member.user.id && userperms>0">
                    {{ member.user.surname }}, {{ member.user.givenname }}
                </router-link>
                <span v-if="!member.user.id || userperms == 0">{{ member.user.surname }}, {{ member.user.givenname }}</span>
            </td>
            <td v-if="show_unit">{{ member.user.ou }}</td>
            <td v-if="!editing">{{ member.role.label }}</td>
            <td v-if="editing">
                <v-select taggable v-model="member.role" :options="roles" v-if="roles"></v-select>
            </td>

            <td v-if="!editing">{{ member.notes }}</td>
            <td v-if="editing"><input class="form-control" v-model="member.notes"></td>

            <td v-if="!editing">{{ member.start_date | moment("YYYY, MMM Do") }}</td>
            <td v-if="editing"><input type="date" class="form-control" v-model.lazy="member.start_date"></td>

            <td v-if="includePreviousMembers && !editing"><span v-if="member.end_date">{{ member.end_date |
                    moment("YYYY, MMM Do") }}</span></td>
            <td v-if="includePreviousMembers && editing"><span v-if="member.end_date"><input type="date" class="form-control"
                        v-model.lazy="member.end_date"></span></td>
            <td v-if="editing" class="text-right"><input class="form-check-input" type="checkbox" v-model="member.admin"></td>
            <td v-if="editing"><button class="btn btn-danger" @click="$emit('remove', member, key)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>
    </tbody>
</template>

<script>
export default {
    props: ['editing', 'filteredList', 'filterList', 'includePreviousMembers', 'roles', 'show_unit', 'userperms'],
    data() {
        return {

        }
    }
}

</script>