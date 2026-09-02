// Throwaway: the section sheet, and whether an edit reaches the grid.
describe("term planning", () => {
  it("edits a section and saves it", () => {
    cy.login("admin");
    cy.visit("/term-planning/groups/4/1269");
    cy.contains("Term Planning", { timeout: 20000 });
    cy.wait(2500);
    cy.get("[data-meeting-id]").first().click();
    cy.wait(300);
    cy.screenshot("sheet-clean", { capture: "viewport" });

    // Move it to Thursday and give it a new cap.
    cy.contains("[aria-label=Days] button", "Th").click();
    cy.contains("[aria-label=Days] button", "M").click();
    cy.get("input[type=number]").clear().type("31");
    cy.wait(200);
    cy.screenshot("sheet-dirty", { capture: "viewport" });

    cy.contains("button", "Save").click();
    cy.wait(400);
    cy.screenshot("after-save", { capture: "viewport" });
  });
});
