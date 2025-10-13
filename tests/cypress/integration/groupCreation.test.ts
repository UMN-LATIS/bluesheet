// groupCreation.js created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test

describe("Groups UI", () => {
  beforeEach(() => {
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
      cy.get("#groupTypes input").type("Comm{enter}");

      // should see that no options are available
      cy.get(".combobox__options").contains("No options.");

      // add a new option
      cy.get(".combobox__options").within(() => {
        cy.get("input").type("Committee");
        cy.get("[data-cy='add-new-option-button']").click();
      });

      // the new option should be selected
      cy.get("#groupTypes").contains("Committee").click();

      // the option should be marked as selected within the option list
      cy.get(".combobox__options [aria-selected=true]").contains("Committee");

      // close the options list
      cy.get(".combobox__options button[aria-label='Close options dropdown']").click();

      cy.get("#parentOrganization").select("CLA");
      cy.get(".btn").contains("Create Group").click();
      cy.contains("Test Group");

      // check that the group is in the list of groups
      cy.get(".app-header").contains("Browse Groups").click();
      cy.get("table").contains("CLA").click();
      cy.get("table").contains("Test Group").click();
      cy.contains("Committee");
    });

    it("edits a group", () => {
      cy.create("App\\Group").then((group) => {
        cy.visit(`/group/${group.id}`);
        cy.contains("Edit Group").click();
        cy.get("#groupTypes").type("List{enter}");
        cy.get("#groupNotes").type("Test Notes");
        cy.contains("Save").click();
        cy.contains("Test Notes");
        cy.contains("List");
      });
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

    it("requires url and label to add a group artifact", () => {
      cy.create("App\\Group").then((group) => {
        cy.visit(`/group/${group.id}`);
        cy.contains("Edit Group").click();
        cy.contains("Add Artifact").click();

        // try to save without entering any data
        cy.contains("Save").click();

        // an error should be displayed
        cy.contains("Every artifact must have a label and valid URL");

        // dismiss the error
        cy.contains("Close").click();

        // try to save with a label but no URL
        cy.get("[data-cy=group-artifacts-section]").within(() => {
          cy.get("[data-cy=artifact-label] input").type("CLA Website");
        });

        cy.contains("Save").click();

        // an error should be displayed
        cy.contains("Every artifact must have a label and valid URL");

        // dismiss the error
        cy.contains("Close").click();

        // add an invalid URL
        cy.get("[data-cy=group-artifacts-section]").within(() => {
          cy.get("[data-cy=artifact-target] input").type("not a url");
          // an error should show up next to the URL input
          cy.contains("URL must be");
        });

        // attempting to save again shows the error
        cy.contains("Save").click();
        cy.contains("Every artifact must have a label and valid URL");

        // dismiss the error
        cy.contains("Close").click();

        // finally add a valid url
        cy.get("[data-cy=group-artifacts-section]").within(() => {
          cy.get("[data-cy=artifact-target] input")
            .clear()
            .type("https://cla.umn.edu");
        });

        // saving should be successful
        cy.contains("Save").click();
        cy.get("[data-cy=group-artifacts-list]").within(() => {
          cy.contains("CLA Website").should(
            "have.attr",
            "href",
            "https://cla.umn.edu",
          );
        });
      });
    });
  });

  context("when authenticated as default user", () => {
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
    });

    it("favorites a group", () => {
      // check that there are no favorites
      cy.visit("/");
      cy.get("[data-cy=favorite-groups-section]").should("not.exist");

      cy.visit("/group/1");
      cy.contains("Favorite").click();

      // check that the favorite groups table contains 1 group
      cy.visit("/");
      cy.get("[data-cy=favorite-groups-section] tbody tr").should(
        "have.length",
        1,
      );
    });

    it("does not show subgroups section if empty", () => {
      cy.create("App\\Group").then((group) => {
        cy.login("user");
        cy.visit(`/group/${group.id}`);
        cy.get("[data-cy=child-groups]").should("not.exist");
      });
    });

    it("only shows Create Subgroup button if user has correct permissions", () => {
      let parentGroup = null;
      let subgroup = null;
      cy.create("App\\Group")
        .then((group) => {
          parentGroup = group;
          return cy.create({
            model: "App\\Group",
            attributes: {
              parent_group_id: parentGroup.id,
            },
          });
        })
        .then((group) => {
          subgroup = group;

          cy.login("user");
          cy.visit(`/group/${parentGroup.id}`);

          // subgroup should be listed
          cy.get("[data-cy=child-groups]").contains(subgroup.group_title);

          // but Create Subgroup button should not be visible
          cy.get("[data-cy=child-groups]").should(
            "not.contain",
            "Create Subgroup",
          );
        });
    });
  });

  context("as a group manager", () => {
    let groupId;
    let groupManagerId;
    beforeEach(() => {
      cy.create("App\\Membership").then((membership) => {
        groupId = membership.group_id;
        groupManagerId = membership.user_id;

        cy.promoteUserToGroupManager({
          userId: groupManagerId,
          groupId,
        });
      });
    });

    it("creates a new subgroup for their group", () => {
      cy.login({ id: groupManagerId });
      cy.visit(`/group/${groupId}`);
      cy.contains("Create Subgroup").click();
      cy.get("#groupName").type("Test Subgroup");
      cy.get("#groupTypes input").type("Working Group{enter}");
      cy.contains("Create Group").click();

      cy.get("[data-cy=child-groups]").contains("Test Subgroup").click();

      cy.contains("Working Group");
    });
  });
});
