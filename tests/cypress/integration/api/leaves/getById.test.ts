import * as api from "../../../support/api";

describe("GET /api/leaves/:id", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .get("/api/leaves/1", { failOnStatusCode: false })
        .its("status")
        .should("eq", 401);
    });
  });

  context("as a basic user", () => {
    it('does not permit a "basic_user" to view a leave', () => {
      cy.login("basic_user");
      api.get("/api/leaves/1", { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(403);
      });
    });

    it('lets a "basic_user" view their own leave', () => {
      let leaveId: number | null = null;
      let basicUserId: number | null = null;

      // create a new leave for the basic user
      cy.login("admin");
      cy.php(`App\\User::where('umndid', 'basic_user')->firstOrFail()->id`)
        .then((id) => {
          basicUserId = parseInt(id);
          return api.post("/api/leaves", {
            user_id: basicUserId,
            description: "test",
            start_date: "2021-01-01",
            end_date: "2021-01-02",
            type: "sabbatical",
            status: "pending",
          });
        })
        .then((response) => {
          leaveId = response.body.id;
          cy.logout();
        })
        .then(() => {
          // login as the basic user and check we can view it
          cy.login("basic_user");
          api.get(`/api/leaves/${leaveId}`).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.keys([
              "id",
              "user_id",
              "description",
              "start_date",
              "end_date",
              "type",
              "status",
              "user",
              "artifacts",
              "created_at",
              "updated_at",
            ]);
          });
        });
    });
  });

  context("as admin user", () => {
    beforeEach(() => {
      cy.login("admin");
    });

    it("returns a single leave", () => {
      api.get("/api/leaves/1").then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.keys([
          "id",
          "user_id",
          "description",
          "start_date",
          "end_date",
          "type",
          "status",
          "user",
          "artifacts",
          "created_at",
          "updated_at",
        ]);
      });
    });

    it('404s with an invalid "id" parameter', () => {
      api
        .get("/api/leaves/999", { failOnStatusCode: false })
        .then((response) => {
          expect(response.status).to.eq(404);
        });
    });
  });
});
