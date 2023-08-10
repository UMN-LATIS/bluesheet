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
    beforeEach(() => {
      cy.login("basic_user");
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
