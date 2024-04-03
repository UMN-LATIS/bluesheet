import * as api from "../../../support/api";

describe("GET /api/user/:id/leaves", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
    cy.login("admin")
      .then(() => {
        [1, 2, 3].forEach((n) =>
          api.post("/api/leaves", {
            description: `Leave ${n}`,
            start_date: "2020-01-01",
            end_date: "2020-01-02",
            type: "sabbatical",
            status: "pending",
            user_id: 1,
          }),
        );
      })
      .then(() => cy.logout());
  });

  const canViewLeaves = ["global_group_admin", "site_admin", "admin"];
  canViewLeaves.forEach((role) => {
    it(`permits a ${role} to view leaves for other users`, () => {
      cy.login(role);
      api.get("/api/users/1/leaves").then((response) => {
        expect(response.status).to.eq(200);
        const leaves = response.body;
        expect(leaves).to.have.length(3);
        expect(leaves[0]).to.have.keys([
          "id",
          "user_id",
          "description",
          "user",
          "start_date",
          "end_date",
          "type",
          "status",
          "canCurrentUser",
        ]);
        leaves.forEach((leave) => {
          expect(leave.user_id).to.eq(1);
        });
      });
    });
  });

  it("lets a user view their own leaves", () => {
    cy.getUserByUsername("basic_user").then((basicUser) => {
      cy.login("basic_user");
      api.get(`/api/users/${basicUser.id}/leaves`).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  });

  it("does not permit users to view leaves for other users", () => {
    cy.login("basic_user");
    api
      .get("/api/users/1/leaves", { failOnStatusCode: false })
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });

  it("does not permit unauthenticated users to view leaves", () => {
    api
      .get("/api/users/1/leaves", { failOnStatusCode: false })
      .then((response) => {
        expect(response.status).to.eq(401);
      });
  });

  it("does not permit users to view leaves for non-existent users", () => {
    cy.login("global_group_admin");
    api
      .get("/api/users/999/leaves", { failOnStatusCode: false })
      .then((response) => {
        expect(response.status).to.eq(404);
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
        });
    });

    it("lets a group manager get any member's leaves", () => {
      cy.promoteUserToGroupManager({
        userId: fellowGroupMembership.user_id,
        groupId: fellowGroupMembership.group_id,
      })
        .then(() => {
          cy.login({ id: fellowGroupMembership.user_id });
        })
        .then(() => {
          return api.get(`/api/users/${leave.user_id}/leaves`);
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          const leaves = response.body;
          expect(leaves).to.have.length(1);
          expect(leaves[0].id).to.eq(leave.id);
        });
    });
  });
});
