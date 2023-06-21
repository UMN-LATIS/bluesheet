<template>
    <treeselect v-if="parentOrganizations" v-model="parentOrganizationValue" :multiple="false" :options="parentOrganizations" :clearable="false"
        :searchable="true" :openOnClick="true" :closeOnSelect="true" label="group_title" />
</template>

<script>
    export default {
        props: ['value'],
        data() {
            return {
                parentOrganizations: []
            }
        },
        computed: {
             parentOrganizationValue: {
                get() {
                    return this.value;
                },
                set(val) {
                    this.$emit('input', val);
                }
            }
        },
        methods: {
            remapParents: function(p) {
                return p.map(org => {
                    var result = {
                        "id": org.id,
                        "label": org.group_title
                    };
                    if (org.child_organizations_recursive.length > 0) {
                        result.children = this.remapParents(org.child_organizations_recursive)
                        result.children.sort((a, b) => a.label < b.label ? -1 : 1);
                    }
                    return result;
                });
            }
        },
        mounted: function() {
            axios.get("/api/group/parents")
            .then(res => {
                this.parentOrganizations = this.remapParents(res.data);
            })
            .catch(err => {
                console.error(err);
            });
        }

    }

</script>

<style>

</style>
