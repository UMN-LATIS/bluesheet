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

  const canViewLeaves = ["group_admin", "site_admin", "admin"];
  canViewLeaves.forEach((role) => {
    it(`permits a ${role} to view leaves for other users`, () => {
      cy.login(role);
      api.get("/api/users/1/leaves").then((response) => {
        expect(response.status).to.eq(200);
        const leaves = response.body.data;
        expect(leaves).to.have.length(3);
        expect(leaves[0]).to.have.keys([
          "id",
          "user_id",
          "description",
          "start_date",
          "end_date",
          "type",
          "status",
          "created_at",
          "updated_at",
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
    cy.login("group_admin");
    api
      .get("/api/users/999/leaves", { failOnStatusCode: false })
      .then((response) => {
        expect(response.status).to.eq(404);
      });
  });
});
