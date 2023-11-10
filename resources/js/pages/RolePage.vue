<template>
  <DefaultLayout>
    <div v-if="state.error" class="alert alert-danger" role="alert">
      {{ state.error }}
    </div>
    <template v-if="state.role">
      <button
        class="btn btn-outline-primary float-right"
        @click="userStore.toggleRoleFavorite(state.role)"
      >
        <i
          class="fa-star"
          :class="{ fas: roleFavorited, far: !roleFavorited }"
        ></i>
        Favorite
      </button>
      <h1>{{ state.role.label }}</h1>
      <div v-if="state.parentOrganizations" class="form-group row">
        <label for="parentOrganization" class="col-sm-2 col-form-label"
          >Filter by Folder</label
        >
        <div class="col-sm-6">
          <SimpleNestedSelect
            v-model="state.parentOrganizationId"
            :options="state.parentOrganizations"
            :isNullable="true"
          />
        </div>
      </div>
      <Members
        :members="filteredMembers"
        :editing="false"
        :roles="[state.role]"
        :show_unit="false"
        :filterList="null"
        groupType="department"
        viewType="role"
        :downloadTitle="state.role.label"
      />
    </template>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import Members from "@/components/Members.vue";
import SimpleNestedSelect from "@/components/SimpleNestedSelect.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { axios } from "@/utils";
import { usePageTitle } from "@/utils/usePageTitle";
import { reactive, ref, computed, watch } from "vue";
import { MemberRole, Membership, ParentOrganization } from "@/types";
import { useUserStore } from "@/stores/useUserStore";
import { useRoleStore } from "@/stores/useRoleStore";
import { OptionNode } from "@/components/SimpleNestedSelect.vue";

type RemappedParentOrganization = OptionNode;

const props = defineProps<{
  roleId: number;
}>();

const state = reactive({
  error: null as string | null,
  editing: false,
  role: null as MemberRole | null,
  parentOrganizationId: null as ParentOrganization["id"] | null,
  parentOrganizations: null as RemappedParentOrganization[] | null,
});

const userStore = useUserStore();
const roleStore = useRoleStore();

const filteredMembers = computed(() => {
  if (!state.role || !state.role.members) {
    return [];
  }

  if (!state.parentOrganizationId) {
    return state.role.members;
  }

  if (!state.parentOrganizations?.length) {
    throw new Error(
      "parentOrganizations is null or empty, but parentOrganization is not null",
    );
  }

  let targetLeaf = findLeaf(
    state.parentOrganizations[0],
    state.parentOrganizationId,
  );

  if (!targetLeaf) {
    throw new Error(
      `Could not find leaf with id ${state.parentOrganizationId} in parentOrganizations`,
    );
  }

  let targetOrganizations = recursivePluckId(targetLeaf);
  return state.role.members.filter((m) =>
    targetOrganizations.includes(m.group.parent_organization_id),
  );
});

const roleFavorited = userStore.isRoleFavorited(props.roleId);

watch(
  () => state.role,
  () => {
    usePageTitle(state.role?.label || "");
  },
  { immediate: true },
);

watch(
  () => props.roleId,
  async () => {
    const [role, parentOrganizations] = await Promise.all([
      roleStore.fetchRole(props.roleId),
      roleStore.fetchParentOrganizations(),
    ]);

    state.role = role;
    state.parentOrganizations = remapParents(parentOrganizations);
  },
  { immediate: true },
);

function remapParents(
  parentOrgs: ParentOrganization[],
): RemappedParentOrganization[] {
  return parentOrgs.map((org) => ({
    id: org.id,
    label: org.group_title,
    children: remapParents(org.child_organizations_recursive),
  }));
}

interface NestedObject {
  id: string | number;
  children?: NestedObject[];
}

function findLeaf(
  element: NestedObject,
  id: string | number,
): NestedObject | null {
  if (element.id == id) {
    return element;
  }

  if (!element.children) {
    return null;
  }

  for (const child of element.children) {
    const leaf = findLeaf(child, id);
    if (leaf) return leaf;
  }

  return null;
}

function recursivePluckId(items: NestedObject): (number | string)[] {
  let returnArray = [] as (number | string)[];
  if (items.id) {
    if (items.children) {
      for (let child of items.children) {
        returnArray = returnArray.concat(recursivePluckId(child));
      }
    }
    returnArray.push(items.id);
  }
  return returnArray.flat();
}

// export default {
//   components: {
//     Members,
//     SimpleNestedSelect,
//     DefaultLayout,
//   },
//   props: {
//     roleId: {
//       type: String,
//       required: true,
//     },
//   },
//   data() {
//     return {
//       error: null,
//       role: { label: "", members: [] },
//       editing: false,
//       parentOrganization: null,
//       parentOrganizations: null,
//     };
//   },
//   computed: {
//     filteredMembers: function () {
//       if (!this.parentOrganization) {
//         return this.role.members;
//       } else {
//         let targetLeaf = this.findLeaf(
//           this.parentOrganizations[0],
//           this.parentOrganization,
//         );
//         let targetOrganizations = this.recursivePluckId(targetLeaf);
//         return this.role.members.filter((m) =>
//           targetOrganizations.includes(m.group.parent_organization_id),
//         );
//       }
//     },
//     roleFavorited: function () {
//       if (this.$store.state.favorites["roles"]) {
//         return (
//           this.$store.state.favorites["roles"].filter(
//             (g) => g.id == this.role.id,
//           ).length > 0
//         );
//       }
//       return false;
//     },
//   },
//   watch: {
//     role() {
//       usePageTitle(this.role?.label || "");
//     },
//   },
//   mounted() {
//     axios
//       .get("/api/role/" + this.roleId)
//       .then((res) => {
//         this.role = res.data;
//       })
//       .catch((err) => {
//         this.error = err.response.data;
//       });
//     axios
//       .get("/api/group/parents")
//       .then((res) => {
//         this.parentOrganizations = this.remapParents(res.data);
//       })
//       .catch((err) => {
//         console.error(err);
//       });
//   },
//   methods: {
//     remapParents: function (p) {
//       return p.map((org) => {
//         var result = { id: org.id, label: org.group_title };
//         if (org.child_organizations_recursive.length > 0) {
//           result.children = this.remapParents(
//             org.child_organizations_recursive,
//           );
//         }
//         return result;
//       });
//     },
//     findLeaf: function (element, id) {
//       if (element.id == id) {
//         return element;
//       } else {
//         if (element.children) {
//           for (const child of element.children) {
//             element = this.findLeaf(child, id);
//             if (element) {
//               return element;
//             }
//           }
//         }
//       }
//       return false;
//     },
//     recursivePluckId: function (organization) {
//       var returnArray = [];
//       if (organization.id) {
//         if (organization.children) {
//           for (let child of organization.children) {
//             returnArray.push(this.recursivePluckId(child));
//           }
//         }

//         returnArray.push(organization.id);
//       }
//       return returnArray.flat();
//     },
//   },
// };
//
</script>
