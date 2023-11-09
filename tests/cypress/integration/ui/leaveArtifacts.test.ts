function createLeaveArtifact(
  userId,
  label = "Test Artifact",
  target = "https://example.com",
) {
  cy.visit(`/user/${userId}`);

  cy.get("[data-cy=leaveRow]")
    .first()
    .within(() => {
      cy.contains("Edit").click();
    });

  cy.contains("Add Artifact").click();
  cy.get('[data-cy="artifactLabelInput"] input').type(label);
  cy.get('[data-cy="artifactTargetInput"] input').type(target);
  cy.get('[data-cy="leaveArtifactRow"]').within(() => {
    cy.contains("Save").click();
    cy.wait("@apiCreateLeaveArtifact");
  });
}

describe("Leave Artifacts", () => {
  let basicUserId: number | null = null;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed("TestDatabaseSeeder");
    cy.getUserByUsername("basic_user").then((user) => {
      basicUserId = user.id;
    });

    cy.intercept({
      method: "POST",
      url: "/api/leaves/*/artifacts",
    }).as("apiCreateLeaveArtifact");

    cy.login("group_admin");
  });

  it("add and then cancel adding an artifact", () => {
    cy.visit(`/user/${basicUserId}`);

    cy.get("[data-cy=leaveRow]")
      .first()
      .within(() => {
        cy.contains("Edit").click();
      });

    // at first, there should be no artifacts
    cy.get('[data-cy="leaveArtifactRow"]').should("have.length", 0);

    cy.contains("Add Artifact").click();
    cy.get('[data-cy="leaveArtifactRow"]')
      .should("have.length", 1)
      .within(() => {
        cy.contains("Cancel").click();
      });

    cy.get('[data-cy="leaveArtifactRow"]').should("have.length", 0);
  });

  it("creates a new artifact", () => {
    cy.visit(`/user/${basicUserId}`);

    cy.get("[data-cy=leaveRow]")
      .first()
      .within(() => {
        cy.contains("Edit").click();
      });

    // at first, there should be no artifacts
    cy.get('[data-cy="leaveArtifactRow"]').should("have.length", 0);

    cy.contains("Add Artifact").click();
    cy.get('[data-cy="artifactLabelInput"] input').type("Test Artifact");
    cy.get('[data-cy="artifactTargetInput"] input').type("https://example.com");

    cy.get('[data-cy="leaveArtifactRow"]').within(() => {
      cy.contains("Save").click();
      cy.contains("Test Artifact").should(
        "have.attr",
        "href",
        "https://example.com",
      );
    });
  });

  describe("when there are existing artifacts", () => {
    beforeEach(() => {
      createLeaveArtifact(basicUserId);
    });

    it("edits an artifact and then cancels the edit", () => {
      cy.get('[data-cy="leaveArtifactRow"]').within(() => {
        cy.contains("Edit").click();
        cy.get('[data-cy="artifactLabelInput"] input')
          .first()
          .type("{selectall}Test Artifact Edited");
        cy.get('[data-cy="artifactTargetInput"] input')
          .first()
          .type("{selectall}https://example.com/edited");
        cy.contains("Cancel").click();

        // the edits should not persist
        cy.contains("Test Artifact Edited").should("not.exist");
        cy.contains("Test Artifact").should(
          "have.attr",
          "href",
          "https://example.com",
        );
      });
    });

    it("edits and then saves an artifact", () => {
      cy.get('[data-cy="leaveArtifactRow"]').within(() => {
        cy.contains("Edit").click();
        cy.get('[data-cy="artifactLabelInput"] input')
          .first()
          .type("{selectall}Test Artifact Edited");
        cy.get('[data-cy="artifactTargetInput"] input')
          .first()
          .type("{selectall}https://example.com/edited");
        cy.contains("Save").click();

        cy.contains("Test Artifact Edited").should("exist");
        cy.contains("Test Artifact").should(
          "have.attr",
          "href",
          "https://example.com/edited",
        );
      });
    });

    it("deletes an artifact", () => {
      cy.get('[data-cy="leaveArtifactRow"]').within(() => {
        cy.contains("Delete").click();
        cy.get('[data-cy="leaveArtifactRow"]').should("have.length", 0);
      });
    });
  });
});
