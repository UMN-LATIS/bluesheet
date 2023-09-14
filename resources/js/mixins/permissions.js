//https://mmccaff.github.io/2018/11/03/laravel-permissions-in-vue-components/
export default {
  methods: {
    $can(permissionName) {
      return Permissions.indexOf(permissionName) !== -1;
    },
  },
};
