import { apiRequest } from "../../support/apiRequest";

describe("Leaves API", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  context('as an unauthenticated user', () => {
    describe("GET /leaves", () => {
      it("returns a 401", () => {
        apiRequest('GET', '/api/leaves', { failOnStatusCode: false }).its('status').should('eq', 401);
      });
    });
  });

  context("when authenticated as admin", () => {
    beforeEach(() => {
      cy.login("admin");
    });

    describe("GET /leaves", () => {
      it("returns a list of leaves", () => {
        cy.request("/api/leaves").then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.length(2);
        });
      });
    });
  });
});
