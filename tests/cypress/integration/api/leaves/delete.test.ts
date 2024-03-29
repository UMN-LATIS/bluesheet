import { UserPermissions } from "../../../../../resources/js/types";
import api from "../../../support/api";

describe("DELETE /api/leaves/:id", () => {
  let leaveId;
  let validLeave;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    cy.create("App\\Leave").then((createdLeave) => {
      leaveId = createdLeave.id;
      validLeave = createdLeave;
    });
  });

  it("returns a 401 for unauthenticated user", () => {
    api
      .delete(`/api/leaves/${leaveId}`, { failOnStatusCode: false })
      .its("status")
      .should("eq", 401);
  });

  it("lets a super admin deletes a leave", () => {
    cy.login("admin");

    api.delete(`/api/leaves/${leaveId}`).then((response) => {
      expect(response.status).to.eq(204);
    });

    api
      .get(`/api/leaves/${leaveId}`, { failOnStatusCode: false })
      .then((response) => {
        expect(response.status).to.eq(404);
      });
  });

  it("does not let a regular user delete a leave", () => {
    cy.login("view_user");

    api
      .delete(`/api/leaves/${leaveId}`, { failOnStatusCode: false })
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });

  it("lets a user with `edit any leaves` permission delete a leave", () => {
    cy.login("view_user");

    // give the user permission to edit leaves
    cy.addPermissionToUser(UserPermissions.EDIT_ANY_LEAVES, "view_user");

    // delete the leave
    api.delete(`/api/leaves/${leaveId}`).then((response) => {
      expect(response.status).to.eq(204);
    });
  });

  it("does not let a user delete their own leave", () => {
    cy.login({ id: validLeave.user_id });

    api
      .delete(`/api/leaves/${leaveId}`, { failOnStatusCode: false })
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });

  context("as a fellow group member", () => {
    let fellowGroupMembership;
    let leave;

    beforeEach(() => {
      // create a new leave
      // which will also create the leaveOwner user
      cy.create("App\\Leave")
        .then((createdLeave) => {
          leave = createdLeave;

          // create a new membership for the leave owner
          // which will also create the group for our test
          return cy.create({
            model: "App\\Membership",
            attributes: {
              user_id: leave.user_id,
            },
          });
        })
        .then((leaveUserMembership) => {
          // create another membership within the group
          // which will also create a fellow group member
          // which we can promote to a group manager when
          // we want
          return cy.create({
            model: "App\\Membership",
            attributes: {
              group_id: leaveUserMembership.group_id,
            },
          });
        })
        .then((membership) => {
          fellowGroupMembership = membership;

          cy.login({
            id: fellowGroupMembership.user_id,
          });
        });
    });

    it("lets a group manager delete any member's leave", () => {
      // promote the follow group member to a group manager
      cy.promoteUserToGroupManager({
        userId: fellowGroupMembership.user_id,
        groupId: fellowGroupMembership.group_id,
      })
        .then(() => {
          // then login as the group manager and check we can view the leave
          cy.login({ id: fellowGroupMembership.user_id });
        })
        .then(() => {
          return api.delete(`/api/leaves/${leave.id}`);
        })
        .then((response) => {
          expect(response.status).to.eq(204);
        })
        .then(() => {
          return api.get(`/api/leaves/${leave.id}`, {
            failOnStatusCode: false,
          });
        })
        .then((response) => {
          expect(response.status).to.eq(404);
        });
    });

    it("does not permit a non-managing member to delete leaves of other members", () => {
      cy.login({ id: fellowGroupMembership.user_id });

      api
        .delete(`/api/leaves/${leave.id}`, { failOnStatusCode: false })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });

    it("does not permit a group manager to delete leaves of other groups", () => {
      cy.promoteUserToGroupManager({
        userId: fellowGroupMembership.user_id,
        groupId: fellowGroupMembership.group_id,
      }).then(() => {
        cy.login({ id: fellowGroupMembership.user_id });

        cy.create("App\\Leave").then((createdLeave) => {
          api
            .delete(`/api/leaves/${createdLeave.id}`, {
              failOnStatusCode: false,
            })
            .then((response) => {
              expect(response.status).to.eq(403);
            });
        });
      });
    });
  });
});
