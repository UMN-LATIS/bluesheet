// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("getUserByUsername", (umndid: string) => {
  return cy.php(`App\\User::where('umndid', '${umndid}')->firstOrFail()`);
});

Cypress.Commands.add("getUser", (userId: number) => {
  return cy.php(`App\\User::findOrFail(${userId});`);
});

Cypress.Commands.add("addRoleToUser", (roleName: string, umndid: string) => {
  return cy.php(`
    $roleId = App\\Role::where('name', '${roleName}')->firstOrFail()->id;
    $user = App\\User::where('umndid', '${umndid}')->firstOrFail();
    $user->roles()->attach($roleId);
  `);
});

Cypress.Commands.add(
  "givePermissionToUser",
  (permissionName: string, umndid: string) => {
    return cy.php(`
    App\\User::where('umndid', '${umndid}')->firstOrFail()->givePermissionTo('${permissionName}');
  `);
  },
);

Cypress.Commands.add(
  "createMembership",
  ({
    umndid,
    groupName,
    roleName,
  }: {
    umndid: string;
    groupName: string;
    roleName: string;
  }) => {
    return cy.php(`
    $user = App\\User::where('umndid', '${umndid}')->firstOrFail();
    $group = App\\Group::where('title', '${groupName}')->firstOrFail();
    $role = App\\Role::where('name', ${roleName})->firstOrFail();
    App\\Membership::create([
      'user_id' => $user->id,
      'group_id' => $group->id,
      'role_id' => $role->id,
    ]);
  `);
  },
);

Cypress.Commands.add(
  "promoteUserToGroupManager",
  ({ userId, groupId }: { userId: number; groupId: number }) => {
    return cy.php(`
    App\\Membership::where("user_id", ${userId})
    ->where("group_id", ${groupId})
    ->update([
      'admin' => true,
    ]);
  `);
  },
);
