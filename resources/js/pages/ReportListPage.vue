<template>
  <DefaultLayout>
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
        <li class="list-group-item">
          <router-link
            v-if="$can('view reports')"
            :to="{ name: 'fiscal' }"
            class="nav-link"
            >Fiscal Unit Assignments
          </router-link>
        </li>
        <li class="list-group-item">
          <router-link
            v-if="$can('view reports')"
            :to="{ name: 'committeeService' }"
            class="nav-link"
            >Committee Service
          </router-link>
        </li>
        <li class="list-group-item">
          <router-link
            v-if="$can('view reports')"
            :to="{ name: 'groupadmins' }"
            class="nav-link"
            >Group Admins
          </router-link>
        </li>
        <li v-if="$can('view eligibility')" class="list-group-item">
          <router-link :to="{ name: 'eligibilityReport' }" class="nav-link"
            >Eligibility Report
          </router-link>
        </li>
        <li v-if="$can('view eligibility')" class="list-group-item">
          <router-link
            v-if="$can('view leaves')"
            :to="{ name: 'deptLeavesReport' }"
            class="nav-link"
          >
            Department Leaves Report
          </router-link>
        </li>
      </ul>
      <p>
        Got an idea for a report?
        <a href="mailto:mcfa0086@umn.edu">Let us know</a>!
      </p>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { $can } from "@/utils";
import { usePageTitle } from "@/utils/usePageTitle";

usePageTitle("Reports");
</script>
