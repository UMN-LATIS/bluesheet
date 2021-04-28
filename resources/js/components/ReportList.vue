<template>
    <div>
        <h1>Group Reports</h1>
        <ul class="list-group">
            <li class="list-group-item"><router-link :to="{ name: 'missingOfficial' }" class="nav-link" v-if="$can('view reports')">Departments with missing official roles</router-link></li>
            <li class="list-group-item"><router-link :to="{ name: 'lastModified' }" class="nav-link" v-if="$can('view reports')">Last Modified Dates</router-link></li>
        </ul>
        <p>Got an idea for a report? <a href="mailto:mcfa0086@umn.edu">Let us know</a>!</p>
    </div>
</template>

<script>
export default {
    
}
</script>