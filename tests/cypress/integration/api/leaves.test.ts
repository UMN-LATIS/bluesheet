describe("Leaves API", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
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
