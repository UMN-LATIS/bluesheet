// groupCreation.js created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test

describe("Groups Manager Permissions", () => {
  before(() => {
    cy.refreshDatabase();
    cy.seed("TestDatabaseSeeder");
  });

  context("as a regulary group member", () => {
    it("cannot edit a group");

    it("cannot add a member to a group");

    it("cannot promote a member to a group manager");

    it("cannot view a group member's leaves");

    it("cannot access the group course/leave planning page");

    it("cannot create a new subgroup");
  });

  context("as a group manager (group admin)", () => {
    it("can edit a group");

    it("can view a group member's leaves");

    it("can access the group course/leave planning page");

    it("can promote another member to a group manager");

    it("can demote another group manager to a regular member");

    it("can edit a subgroup");

    it("can view a subgroup member's leaves");

    it("can access the subgroup course/leave planning page");

    it("can promote another subgroup member to a subgroup manager");

    it("can demote another subgroup manager to a regular subgroup member");

    it("can create a new subgroup");
  });
});
