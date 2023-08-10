import * as api from "../../../support/api";

describe("GET /api/leaves", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .get("/api/leaves", { failOnStatusCode: false })
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

    it("returns a list of leaves", () => {
      api.get("/api/leaves").then((response) => {
        expect(response.status).to.eq(200);

        const leaves = response.body.data;
        expect(leaves).to.have.length.greaterThan(0);
        expect(leaves[0]).to.have.keys([
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
  });
});
