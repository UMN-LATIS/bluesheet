import * as api from "../../../support/api";
import { UserPermissions } from "../../../../../resources/js/types";

describe("GET /api/leaves/:leaveId/artifacts", () => {
  let leave;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    cy.create("App\\Leave").then((l) => {
      leave = l;
      cy.create({
        model: "App\\LeaveArtifact",
        attributes: {
          leave_id: leave.id,
        },
        count: 2,
      });
    });
  });

  it("returns a 401 when unauthenticated", () => {
    api
      .get(`/api/leaves/${leave.id}/artifacts`, {
        failOnStatusCode: false,
      })
      .its("status")
      .should("eq", 401);
  });

  it("does not permit a regular use to view a leave's artifacts", () => {
    cy.login("view_user");

    api
      .get(`/api/leaves/${leave.id}/artifacts`, {
        failOnStatusCode: false,
      })
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });

  it("permits a user to view their own leave artifacts", () => {
    cy.login({ id: leave.user_id });

    api.get(`/api/leaves/${leave.id}/artifacts`).then((response) => {
      expect(response.status).to.eq(200);
      const artifacts = response.body;
      expect(artifacts).to.have.length(2);
      expect(artifacts[0]).to.have.keys([
        "id",
        "leave_id",
        "label",
        "target",
        "created_at",
        "updated_at",
      ]);
    });
  });

  it("lets a user with `view leaves` permission view all artifacts", () => {
    // give some regular user permission to view leaves
    cy.addPermissionToUser(UserPermissions.VIEW_ANY_LEAVES, "view_user");
    cy.login("view_user");

    api.get(`/api/leaves/${leave.id}/artifacts`).then((response) => {
      expect(response.status).to.eq(200);
      const artifacts = response.body;
      expect(artifacts).to.have.length(2);
    });
  });

  context("as a fellow group member", () => {
    let groupAdminMembership;

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
          groupAdminMembership = membership;

          cy.login({
            id: groupAdminMembership.user_id,
          });
        });
    });

    it("permits a group manager to view leave artifacts of group member", () => {
      cy.promoteUserToGroupManager({
        userId: groupAdminMembership.user_id,
        groupId: groupAdminMembership.group_id,
      });

      api.get(`/api/leaves/${leave.id}/artifacts`).then((response) => {
        expect(response.status).to.eq(200);
        const artifacts = response.body;
        expect(artifacts).to.have.length(2);
      });
    });

    it("does not permit a regular group member to view artifacts for a leave", () => {
      api
        .get(`/api/leaves/${leave.id}/artifacts`, {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });
});
