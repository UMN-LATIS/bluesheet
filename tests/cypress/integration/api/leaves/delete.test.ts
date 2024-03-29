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
});
