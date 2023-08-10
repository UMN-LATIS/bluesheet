describe("User leaves", () => {
  let basicUserId: number | null = null;
  before(() => {
    cy.refreshDatabase();
    cy.seed("TestDatabaseSeeder");
    cy.getUserByUsername("basic_user").then((user) => {
      basicUserId = user.id;
    });
  });

  context("as a user that can view leaves", () => {
    beforeEach(() => {
      cy.login("group_admin");
    });

    it("displays the user's leaves", () => {
      cy.visit(`/user/${basicUserId}`);
      // expect the leaves table to have two rows
      cy.get("[data-cy=leavesTable] tbody tr").should("have.length", 2);

      // click Show Past
      cy.get("[data-cy=leavesSection]").contains("Show Past").click();

      // expect a total of 5 rows now
      cy.get("[data-cy=leavesTable] tbody tr").should("have.length", 5);
    });
  });

  context("as a user that can create new leaves", () => {
    beforeEach(() => {
      cy.login("group_admin");
    });

    it("creates a new leave", () => {
      cy.visit("/user/${basicUserId}");
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
