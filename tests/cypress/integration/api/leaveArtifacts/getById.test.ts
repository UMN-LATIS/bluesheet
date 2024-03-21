import * as api from "../../../support/api";

const validLeave = {
  description: "New leave",
  start_date: "2021-01-01",
  end_date: "2021-01-02",
  status: "pending",
  type: "development",
  user_id: 1,
};

const validArtifact = {
  label: "New artifact",
  target: "https://example.com",
};

describe("GET /api/leaves/:leaveId/artifacts/:artifactId", () => {
  let leaveId;
  let artifactId;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    cy.login("admin");

    api
      .post("/api/leaves", validLeave)
      .then((response) => {
        leaveId = response.body.id;
        return leaveId;
      })
      .then((leaveId) => {
        return api
          .post(`/api/leaves/${leaveId}/artifacts`, validArtifact)
          .then((response) => {
            artifactId = response.body.id;
            return artifactId;
          });
      })
      .then(() => {
        cy.logout();
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

  it("lets a user with `view leaves` permission view an artifact", () => {
    // give some regular user permission to view leaves
    cy.givePermissionToUser("view leaves", "view_user");
    cy.login("view_user");

    api
      .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`)
      .then((response) => {
        expect(response.status).to.eq(200);
        const artifact = response.body;
        expect(artifact).to.have.keys([
          "id",
          "leave_id",
          "leave", // will be included because we're checking the leave owner in the policy
          "label",
          "target",
          "created_at",
          "updated_at",
        ]);
        expect(artifact.label).to.eq(validArtifact.label);
        expect(artifact.target).to.eq(validArtifact.target);
      });
  });

  context("as a fellow group member", () => {
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
          expect(artifact).to.have.keys([
            "id",
            "leave_id",
            "leave", // will be included because we're checking the leave owner in the policy
            "label",
            "target",
            "created_at",
            "updated_at",
          ]);
          expect(artifact.label).to.eq(validArtifact.label);
          expect(artifact.target).to.eq(validArtifact.target);
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
});
