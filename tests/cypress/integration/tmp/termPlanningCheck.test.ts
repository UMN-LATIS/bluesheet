// Throwaway: a look at the section sheet while it is being built.
describe("term planning", () => {
  it("opens the section sheet", () => {
    cy.login("admin");
    cy.visit("/term-planning/groups/4/1269");
    cy.contains("Term Planning", { timeout: 20000 });
    cy.wait(2500);
    cy.get("[data-meeting-id]").first().click();
    cy.wait(500);
    cy.screenshot("sheet", { capture: "viewport" });
  });
});
