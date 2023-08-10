describe("User leaves", () => {
  before(() => {
    cy.refreshDatabase();
    cy.seed("TestDatabaseSeeder");
  });

  context("as a user that can create new leaves", () => {
    beforeEach(() => {
      cy.login("group_admin");
    });

    it("creates a new leave", () => {
      cy.visit("/user");
      cy.contains("Add Leave").click();
      cy.get("[data-cy=leaveDescription] input").type("Test Leave");
      cy.get("[data-cy=leaveStartDate] input").type("2020-01-01");
      cy.get("[data-cy=leaveEndDate] input").type("2020-01-02");
      cy.get("[data-cy=leaveType] select").select("Sabbatical");
      cy.get("[data-cy=leaveStatus] select").select("Pending");
      cy.contains("Save").click();
    });
  });

  context("as a user that can't create new leaves", () => {
    it('should not see the "Add Leave" button', () => {
      cy.login("basic_user");
      cy.visit("/user");
      cy.contains("Add Leave").should("not.exist");
    });
  });
});
