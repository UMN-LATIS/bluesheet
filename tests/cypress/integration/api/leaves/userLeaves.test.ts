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
        const leaves = response.body;
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

describe("PUT /api/users/:id/leaves", () => {
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

  context("as a user with permission to edit leaves", () => {
    beforeEach(() => {
      cy.login("group_admin");
    });

    it("updates a set of leaves for another user", () => {
      api.get("/api/users/1/leaves").then((response) => {
        expect(response.status).to.eq(200);
        const leaves = response.body;
        const updatedLeaves = leaves.map((leave, index) => {
          return {
            ...leave,
            description: `Updated leave ${index + 1}`,
          };
        });

        // update the admin's leaves
        api
          .put(`/api/users/1/leaves`, { leaves: updatedLeaves })
          .then((response) => {
            expect(response.status).to.eq(200);
            const returnedLeaves = response.body;
            expect(returnedLeaves).to.have.length(3);
            returnedLeaves.forEach((leave, index) => {
              expect(leave.description).to.eq(`Updated leave ${index + 1}`);
            });
          });
      });
    });

    it("does not permit users to update leaves for non-existent users", () => {
      api
        .put(
          "/api/users/999/leaves",
          { leaves: [] },
          { failOnStatusCode: false },
        )
        .then((response) => {
          expect(response.status).to.eq(404);
        });
    });

    it("creates new leaves if included in the update set", () => {
      api.get("/api/users/1/leaves").then((response) => {
        expect(response.status).to.eq(200);
        const leaves = response.body;
        const newLeave = {
          description: "New leave",
          start_date: "2020-01-01",
          end_date: "2020-01-02",
          type: "sabbatical",
          status: "pending",
          user_id: 1,
        };

        // update the admin's leaves
        api
          .put(`/api/users/1/leaves`, { leaves: [...leaves, newLeave] })
          .then((response) => {
            expect(response.status).to.eq(200);
            const returnedLeaves = response.body;
            expect(returnedLeaves).to.have.length(4);
            expect(returnedLeaves.map((l) => l.description)).to.include(
              "New leave",
            );
          });
      });
    });

    it("removes leaves if not included in the update set", () => {
      api.get("/api/users/1/leaves").then((response) => {
        expect(response.status).to.eq(200);
        const leaves = response.body;
        const updatedLeaves = leaves.slice(0, 2);

        // update the admin's leaves
        api
          .put(`/api/users/1/leaves`, { leaves: updatedLeaves })
          .then((response) => {
            expect(response.status).to.eq(200);
            const returnedLeaves = response.body;
            expect(returnedLeaves).to.have.length(2);
            expect(returnedLeaves.map((l) => l.description)).to.not.include(
              "Leave 3",
            );
          });
      });

      it("can remove all leaves for a user", () => {
        api.put(`/api/users/1/leaves`, { leaves: [] }).then((response) => {
          expect(response.status).to.eq(200);
          const returnedLeaves = response.body;
          expect(returnedLeaves).to.have.length(0);
        });
      });
    });
  });

  context("as a user without permission to edit leaves", () => {
    beforeEach(() => {
      cy.login("basic_user");
    });

    it("does not permit users to update leaves for other users", () => {
      api
        .put("/api/users/1/leaves", { leaves: [] }, { failOnStatusCode: false })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });

    it("does not permit users to update leaves for non-existent users", () => {
      api
        .put(
          "/api/users/999/leaves",
          { leaves: [] },
          { failOnStatusCode: false },
        )
        .then((response) => {
          expect(response.status).to.eq(404);
        });
    });

    it("does not permit users to update leaves for themselves", () => {
      api
        .put("/api/users/2/leaves", { leaves: [] }, { failOnStatusCode: false })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });
});
