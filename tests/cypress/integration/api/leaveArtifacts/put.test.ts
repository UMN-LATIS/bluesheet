import * as api from "../../../support/api";
import { UserPermissions } from "@/types";

const validArtifact = {
  label: "New artifact",
  target: "https://example.com",
};

describe("PUT /api/leaves/:leaveId/artifacts/:artifactId", () => {
  let validLeave;
  let artifactId;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    cy.create("App\\Leave")
      .then((createdLeave) => {
        validLeave = createdLeave;
        return cy.create({
          model: "App\\LeaveArtifact",
          attributes: {
            ...validArtifact,
            leave_id: validLeave.id,
          },
        });
      })
      .then((createdArtifact) => {
        artifactId = createdArtifact.id;
      });
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .put(
          `/api/leaves/${validLeave.id}/artifacts/${artifactId}`,
          validArtifact,
          {
            failOnStatusCode: false,
          },
        )
        .its("status")
        .should("eq", 401);
    });
  });

  it("does not permit a default user to update an artifact", () => {
    cy.login("user");

    api
      .put(
        `/api/leaves/${validLeave.id}/artifacts/${artifactId}`,
        validArtifact,
        {
          failOnStatusCode: false,
        },
      )
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });

  it("lets a user with `edit leaves` permission update an artifact", () => {
    cy.login("user");

    cy.addPermissionToUser(UserPermissions.EDIT_ANY_LEAVES, "user");
    api
      .put(`/api/leaves/${validLeave.id}/artifacts/${artifactId}`, {
        label: "Updated artifact",
        target: "https://example.com/updated",
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        const artifact = response.body;
        expect(artifact).to.have.keys([
          "id",
          "leave_id",
          "label",
          "target",
          "created_at",
          "updated_at",
        ]);
        expect(artifact.label).to.eq("Updated artifact");
        expect(artifact.target).to.eq("https://example.com/updated");
      });
  });

  it("fails if any required field is missing", () => {
    cy.login("user");
    cy.addPermissionToUser(UserPermissions.EDIT_ANY_LEAVES, "user");

    const fields = Object.keys(validArtifact);

    fields.forEach((field) => {
      const invalidArtifact = { ...validArtifact, [field]: null };

      api
        .put(
          `/api/leaves/${validLeave.id}/artifacts/${artifactId}`,
          invalidArtifact,
          {
            failOnStatusCode: false,
          },
        )
        .then((response) => {
          expect(response.status).to.eq(422);
          expect(response.body.errors[field][0]).to.eq(
            `The ${field.replace("_", " ")} field is required.`,
          );
        });
    });
  });

  context("when the current user is a fellow group member", () => {
    let testUserMembership = null;

    beforeEach(() => {
      cy.create({
        model: "App\\Membership",
        attributes: {
          user_id: validLeave.user_id,
        },
      })
        .then((leaveUserMembership) => {
          // add a test user to the group
          return cy.create({
            model: "App\\Membership",
            attributes: {
              group_id: leaveUserMembership.group_id,
            },
          });
        })
        .then((membership) => {
          testUserMembership = membership;

          cy.login({
            id: testUserMembership.user_id,
          });
        });
    });

    it("lets a group manager update a leave artifact for a member of their group", () => {
      cy.promoteUserToGroupManager({
        userId: testUserMembership.user_id,
        groupId: testUserMembership.group_id,
      });

      api
        .put(`/api/leaves/${validLeave.id}/artifacts/${artifactId}`, {
          label: "Updated artifact",
          target: "https://example.com/updated",
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          const artifact = response.body;
          expect(artifact.label).to.eq("Updated artifact");
          expect(artifact.target).to.eq("https://example.com/updated");
        });
    });

    it("does not let a group manager update a leave artifact for a member of another group", () => {
      cy.create("App\\Group").then((group) => {
        // promote the test user to a group manager
        // of another group, but not the leave owner's group
        cy.promoteUserToGroupManager({
          userId: testUserMembership.user_id,
          groupId: group.id,
        });

        api
          .put(
            `/api/leaves/${validLeave.id}/artifacts/${artifactId}`,
            {
              label: "Updated artifact",
              target: "https://example.com/updated",
            },
            {
              failOnStatusCode: false,
            },
          )
          .then((response) => {
            expect(response.status).to.eq(403);
          });
      });
    });

    it("does not let a non-manager within the group update a leave artifact", () => {
      api
        .put(
          `/api/leaves/${validLeave.id}/artifacts/${artifactId}`,
          {
            label: "Updated artifact",
            target: "https://example.com/updated",
          },
          {
            failOnStatusCode: false,
          },
        )
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });
});
