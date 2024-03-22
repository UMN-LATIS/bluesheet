import api from "../../../support/api";

describe("DELETE /api/leaves/:leaveId/artifacts/:artifactId", () => {
  let leaveId;
  let artifactId;
  let validLeave;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    cy.create("App\\Leave")
      .then((createdLeave) => {
        leaveId = createdLeave.id;
        validLeave = createdLeave;
        return cy.create({
          model: "App\\LeaveArtifact",
          attributes: {
            leave_id: leaveId,
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
        .delete(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
          failOnStatusCode: false,
        })
        .its("status")
        .should("eq", 401);
    });
  });

  context("as a user that can view leaves", () => {
    beforeEach(() => {
      cy.login("view_user");
    });

    it('does not permit a "view_user" to delete an artifact', () => {
      api
        .delete(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });

  it("lets a user with `edit leaves` permission delete an artifact", () => {
    cy.login("edit_user");

    // give the user permission to edit leaves
    cy.addPermissionToUser("edit leaves", "edit_user");

    api
      .delete(`/api/leaves/${leaveId}/artifacts/${artifactId}`)
      .then((response) => {
        expect(response.status).to.eq(204);
      })
      .then(() => {
        return api.get(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(404);
      });
  });

  context("as a group member with `admin` flag", () => {
    let groupAdminMembership;

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
              admin: true,
            },
          });
        })
        .then((membership) => {
          groupAdminMembership = membership;
        });
    });

    it("delete an artifact of another group member", () => {
      cy.login({
        id: groupAdminMembership.user_id,
      });
      api
        .delete(`/api/leaves/${leaveId}/artifacts/${artifactId}`)
        .then((response) => {
          expect(response.status).to.eq(204);
        })
        .then(() => {
          return api.get(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
            failOnStatusCode: false,
          });
        })
        .then((response) => {
          expect(response.status).to.eq(404);
        });
    });
  });

  it("does not permit a member to delete their own leave", () => {
    cy.login({
      id: validLeave.user_id,
    });

    api
      .delete(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
        failOnStatusCode: false,
      })
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });
});
