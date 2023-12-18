// groupCreation.js created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test

describe("Groups UI", () => {
  before(() => {
    cy.refreshDatabase();
    cy.seed("TestDatabaseSeeder");
  });

  context("when authenticated as admin", () => {
    beforeEach(() => {
      cy.login("admin");
    });

    it("show the homepage", () => {
      cy.visit("/");
      cy.contains("Welcome to BlueSheet");
    });

    it("creates a group", () => {
      cy.visit("/");
      cy.get(".app-header").contains("Create Group").click();
      cy.get("#groupName").type("Test Group");
      cy.get("#groupTypes input").type("Committee{enter}");
      cy.get("#parentOrganization").select("CLA");
      cy.get(".btn").contains("Create Group").click();
      cy.contains("Test Group");
    });

    it("loads a group", () => {
      cy.visit("/");
      cy.get(".app-header").contains("Browse Groups").click();
      cy.get("table").contains("CLA").click();
      cy.get("table").contains("Test Group").click();
      cy.contains("Committee");
    });

    it("edits a group", () => {
      cy.visit("/group/1");
      cy.contains("Edit Group").click().wait(1000);
      cy.get("#groupTypes").type("List{enter}");
      cy.get("#groupNotes").type("Test Notes");
      cy.contains("Save").click();
      cy.contains("Test Notes");
      cy.contains("List");
    });

    it("adds a member", () => {
      cy.visit("/group/1");
      cy.contains("Edit Group").click();
      cy.contains("Add Member").click();
      cy.get("#internetId").type("admin");
      cy.get("#roles input").type("Member{enter}");
      cy.get(".modal-container").contains("Add Member").click();
      cy.contains("McAdmin");
      cy.contains("Save").click();
      cy.contains("McAdmin");
    });
  });

  context("when authenticated as user", () => {
    beforeEach(() => {
      cy.login("user");
    });

    it("show the homepage", () => {
      cy.visit("/");
      cy.contains("Welcome to BlueSheet");
    });

    it("cannot create a group", () => {
      cy.visit("/");
      cy.get("body").should("not.have.text", "Create Group");
    });

    it("cannot edit a group", () => {
      cy.visit("/group/1");
      cy.get("body").should("not.have.text", "Create Group");
      cy.contains("McAdmin");
    });

    it("favorites a group", () => {
      cy.visit("/group/1");
      cy.contains("Favorite").click();
      cy.visit("/");
      cy.contains("Test Group");
    });
  });
});
