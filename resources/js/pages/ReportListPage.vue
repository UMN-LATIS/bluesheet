<template>
  <div>
    <h1>Group Reports</h1>
    <ul class="list-group">
      <li class="list-group-item">
        <router-link
          v-if="$can('view reports')"
          :to="{ name: 'missingOfficial' }"
          class="nav-link"
          >Departments with missing official roles</router-link
        >
      </li>
      <li class="list-group-item">
        <router-link
          v-if="$can('view reports')"
          :to="{ name: 'lastModified' }"
          class="nav-link"
          >Last Modified Dates</router-link
        >
      </li>
      <li class="list-group-item">
        <router-link
          v-if="$can('view reports')"
          :to="{ name: 'ceddLike' }"
          class="nav-link"
          >"CEDD-Like-Groups"
        </router-link>
      </li>
      <li class="list-group-item">
        <router-link
          v-if="$can('view reports')"
          :to="{ name: 'orgp' }"
          class="nav-link"
          >ORGP List
        </router-link>
      </li>
    </ul>
    <p>
      Got an idea for a report?
      <a href="mailto:mcfa0086@umn.edu">Let us know</a>!
    </p>
  </div>
</template>

<script setup>
import { $can } from "@/lib";
</script>
