<template>
    <tbody>
        <tr :key="key" v-for="(member, key) in filteredList">
            <td v-if="filterList">
                <input type="checkbox" v-model="member.filtered">
            </td>

            <td>
                <router-link :to="{ name: 'user', params: { userId: member.user.id } }" v-if="member.user.id && userperms>0">
                    {{ member.user.surname }}, {{ member.user.givenname }}
                </router-link>
                <span v-if="!member.user.id || userperms == 0">{{ member.user.surname }}, {{ member.user.givenname }}</span>
            </td>
            <td v-if="show_unit && viewType=='group'">{{ member.user.ou }}</td>
            
            <template v-if="viewType=='group'">
                <td v-if="!editing">{{ member.role.label }}</td>
                <td v-if="editing">
                    <v-select taggable v-model="member.role" :options="roles" v-if="roles"></v-select>
                </td>
            </template>

            <td v-if="viewType=='role'">
                <router-link :to="{ name: 'group', params: { groupId: member.group.id } }" v-if="member.group.id && userperms>0">
                    <group-title :group="member.group" />
                </router-link>
                <span v-if="!member.group.id || userperms == 0">{{ member.group.group_title}}</span>
               
            </td>

            <td v-if="!editing">{{ member.notes }}</td>
            <td v-if="editing"><input class="form-control" v-model="member.notes"></td>

            <td v-if="!editing">{{ member.start_date | moment("YYYY, MMM Do") }}</td>
            <td v-if="editing"><input type="date" class="form-control" v-model.lazy="member.start_date"></td>

            <td v-if="includePreviousMembers && !editing"><span v-if="member.end_date">{{ member.end_date |
                    moment("YYYY, MMM Do") }}</span></td>
            <td v-if="editing"><input type="date" class="form-control"
                        v-model.lazy="member.end_date"></td>
            
            <td v-if="!editing"><i v-if="viewType=='group' && member.role.official_department_role" class="fa fa-check"></i>
                <i v-else class="searchIcon fa fa-close"></i>
            </td>
            <td v-if="editing" class="text-right"><input class="form-check-input" type="checkbox" v-model="member.admin"></td>
            <td v-if="editing"><button class="btn btn-danger" @click="$emit('remove', member, key)"><i class="fas fa-trash-alt"></i></button></td>
        </tr>
    </tbody>
</template>

<script>
export default {
    props: ['editing', 'filteredList', 'filterList', 'includePreviousMembers', 'roles', 'show_unit', 'userperms', 'viewType'],
    data() {
        return {

        }
    }
}

</script>