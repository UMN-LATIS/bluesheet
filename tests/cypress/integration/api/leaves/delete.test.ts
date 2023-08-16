import api from "../../../support/api";

const validLeave = {
  description: "New leave",
  start_date: "2021-01-01",
  end_date: "2021-01-02",
  status: "pending",
  type: "development",
  user_id: 1,
};

describe("DELETE /api/leaves/:id", () => {
  let leaveId;
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
    cy.login("admin");

    api.post("/api/leaves", validLeave).then((response) => {
      leaveId = response.body.id;
    });
    cy.logout();
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .delete(`/api/leaves/${leaveId}`, { failOnStatusCode: false })
        .its("status")
        .should("eq", 401);
    });
  });

  context("as an admin", () => {
    beforeEach(() => {
      cy.login("admin");
    });
    it("deletes a leave", () => {
      api.delete(`/api/leaves/${leaveId}`).then((response) => {
        expect(response.status).to.eq(204);
      });

      api
        .get(`/api/leaves/${leaveId}`, { failOnStatusCode: false })
        .then((response) => {
          expect(response.status).to.eq(404);
        });
    });
  });
});
