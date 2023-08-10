import { apiRequest } from "../../support/apiRequest";

describe("Leaves API", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  context("as an unauthenticated user", () => {
    describe("GET /leaves", () => {
      it("returns a 401", () => {
        apiRequest("GET", "/api/leaves", { failOnStatusCode: false })
          .its("status")
          .should("eq", 401);
      });
    });
  });

  context("when authenticated as admin", () => {
    beforeEach(() => {
      cy.login("admin");
    });

    describe("GET /leaves", () => {
      it("returns a list of leaves", () => {
        apiRequest("GET", "/api/leaves").then((response) => {
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
            "synchronized_leave",
            "created_at",
            "updated_at",
          ]);
        });
      });
    });
  });
});
