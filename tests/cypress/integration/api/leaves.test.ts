import { apiRequest } from "../../support/apiRequest";

function hasExpectedLeaveShape(leave) {
  return expect(leave).to.have.keys([
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
}

describe("Leaves API", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  context("as an unauthenticated user", () => {
    it("/api/leaves returns a 401", () => {
      apiRequest("GET", "/api/leaves", { failOnStatusCode: false })
        .its("status")
        .should("eq", 401);
    });
  });

  context("as admin user", () => {
    beforeEach(() => {
      cy.login("admin");
    });

    it("/api/leaves returns a list of leaves", () => {
      apiRequest("GET", "/api/leaves").then((response) => {
        expect(response.status).to.eq(200);

        const leaves = response.body.data;
        expect(leaves).to.have.length.greaterThan(0);
        hasExpectedLeaveShape(leaves[0]);
      });
    });

    it("/api/leaves/:id returns a single leave", () => {
      apiRequest("GET", "/api/leaves/1").then((response) => {
        expect(response.status).to.eq(200);

        const leave = response.body.data;
        hasExpectedLeaveShape(leave);
      });
    });
  });
});
