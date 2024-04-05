import { UserPermissions } from "../../../../../resources/js/types";
import * as api from "../../../support/api";

describe("GET /api/leaves/:leaveId/artifacts/:artifactId", () => {
  let leaveId;
  let artifactId;
  let expectedArtifact;
  let expectedLeave;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    cy.create("App\\Leave")
      .then((createdLeave) => {
        leaveId = createdLeave.id;
        expectedLeave = createdLeave;
        return cy.create({
          model: "App\\LeaveArtifact",
          attributes: {
            leave_id: leaveId,
          },
        });
      })
      .then((createdArtifact) => {
        artifactId = createdArtifact.id;
        expectedArtifact = createdArtifact;
      });
  });

  it("returns a 401 when unauthenticated", () => {
    api
      .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
        failOnStatusCode: false,
      })
      .its("status")
      .should("eq", 401);
  });

  it("does not permit a regualr user to view leaves", () => {
    cy.login("view_user");

    api
      .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
        failOnStatusCode: false,
      })
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });

  it("permits a user to view their own leave artifacts", () => {
    cy.login({ id: expectedLeave.user_id });

    api
      .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`)
      .then((response) => {
        expect(response.status).to.eq(200);
        const artifact = response.body;
        expect(artifact.label).to.eq(expectedArtifact.label);
        expect(artifact.target).to.eq(expectedArtifact.target);
      });
  });

  it("lets a user with `view leaves` permission view an artifact", () => {
    // give some regular user permission to view leaves
    cy.addPermissionToUser(UserPermissions.VIEW_ANY_LEAVES, "view_user");
    cy.login("view_user");

    api
      .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`)
      .then((response) => {
        expect(response.status).to.eq(200);
        const artifact = response.body;
        expect(artifact.label).to.eq(expectedArtifact.label);
        expect(artifact.target).to.eq(expectedArtifact.target);
      });
  });

  context("as a fellow group member", () => {
    let groupAdminMembership;

    beforeEach(() => {
      cy.create({
        model: "App\\Membership",
        attributes: {
          user_id: expectedLeave.user_id,
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
          groupAdminMembership = membership;

          cy.login({
            id: groupAdminMembership.user_id,
          });
        });
    });

    it("permits an admin to get a leave artifact", () => {
      cy.promoteUserToGroupManager({
        userId: groupAdminMembership.user_id,
        groupId: groupAdminMembership.group_id,
      });

      api
        .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`)
        .then((response) => {
          expect(response.status).to.eq(200);
          const artifact = response.body;
          expect(artifact.label).to.eq(expectedArtifact.label);
          expect(artifact.target).to.eq(expectedArtifact.target);
        });
    });

    it("does not permit a regular group member to get a leave artifact", () => {
      api
        .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });

  it("includes permission information in the response", () => {
    cy.login({ id: expectedLeave.user_id });

    api
      .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`)
      .then((response) => {
        expect(response.status).to.eq(200);
        const artifact = response.body;
        expect(artifact.canCurrentUser).to.deep.eq({
          // a user can view their own artifacts
          // but not update or delete them
          viewAny: true,
          view: true,
          update: false,
          delete: false,
        });
      });
  });
});
