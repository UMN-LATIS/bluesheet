import { UserPermissions } from "@/types";
import * as api from "../../../support/api";

const validArtifact = {
  label: "New artifact",
  target: "https://example.com",
};

describe("POST /api/leaves/:leaveId/artifacts", () => {
  let leave;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    cy.create("App\\Leave").then((createdLeave) => {
      leave = createdLeave;
    });
  });

  it("returns a 401 if unauthenticated", () => {
    api
      .post(`/api/leaves/${leave.id}/artifacts`, validArtifact, {
        failOnStatusCode: false,
      })
      .its("status")
      .should("eq", 401);
  });

  it("does not permit a default user to create an artifact", () => {
    cy.login("user");

    api
      .post(`/api/leaves/${leave.id}/artifacts`, validArtifact, {
        failOnStatusCode: false,
      })
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });

  it("does not permit a user with `view leaves` permission to create an artifact", () => {
    cy.login("user");

    cy.addPermissionToUser(UserPermissions.VIEW_LEAVES, "user");

    api
      .post(`/api/leaves/${leave.id}/artifacts`, validArtifact, {
        failOnStatusCode: false,
      })
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });

  it("does not let a default user create their own leave artifact", () => {
    // login as leave owner
    cy.login({ id: leave.user_id });

    api
      .post(`/api/leaves/${leave.id}/artifacts`, validArtifact, {
        failOnStatusCode: false,
      })
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });

  it("lets a user with `edit leaves` permission to create an artifact", () => {
    cy.login("user");

    cy.addPermissionToUser("edit leaves", "user");

    api
      .post(`/api/leaves/${leave.id}/artifacts`, validArtifact)
      .then((response) => {
        expect(response.status).to.eq(201);
        const artifact = response.body;
        expect(artifact).to.have.keys([
          "id",
          "leave_id",
          "label",
          "target",
          "created_at",
          "updated_at",
        ]);
      });
  });

  it("fails if any required field is missing", () => {
    cy.login("user");
    cy.addPermissionToUser("edit leaves", "user");

    const fields = Object.keys(validArtifact);

    fields.forEach((field) => {
      const artifact = { ...validArtifact, [field]: null };

      api
        .post(`/api/leaves/${leave.id}/artifacts`, artifact, {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(422);
          expect(response.body.errors[field][0]).to.eq(
            `The ${field.replace("_", " ")} field is required.`,
          );
        });
    });
  });

  context("as a fellow group member", () => {
    let testUserMembership = null;

    beforeEach(() => {
      cy.create({
        model: "App\\Membership",
        attributes: {
          user_id: leave.user_id,
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

    it("lets a group manager create a leave artifact for a member of their group", () => {
      cy.promoteUserToGroupManager({
        userId: testUserMembership.user_id,
        groupId: testUserMembership.group_id,
      });

      api
        .post(`/api/leaves/${leave.id}/artifacts`, validArtifact)
        .then((response) => {
          expect(response.status).to.eq(201);
          const artifact = response.body;
          expect(artifact).to.have.keys([
            "id",
            "leave_id",
            "label",
            "target",
            "created_at",
            "updated_at",
          ]);
        });
    });

    it("does not let a group member (non-manager) create a leave artifact for another member of that group", () => {
      api
        .post(`/api/leaves/${leave.id}/artifacts`, validArtifact, {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });
});
