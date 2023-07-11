// see: https://mmccaff.github.io/2018/11/03/laravel-permissions-in-vue-components/

export default function $can(permissionName) {
  // Permissions is a global variable that is set in the main blade template
  return window.Permissions.indexOf(permissionName) !== -1;
}
