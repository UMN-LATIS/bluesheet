// Throwaway: the finished sheet, and whether an edit reaches every view.
describe("term planning", () => {
  it("shows the whole sheet", () => {
    cy.login("admin");
    cy.visit("/term-planning/groups/4/1269");
    cy.contains("Term Planning", { timeout: 20000 });
    cy.wait(2500);
    cy.get("[data-meeting-id]").first().click();
    cy.wait(400);
    cy.screenshot("sheet-full", { capture: "viewport" });
  });
});
