describe("Laravel Nova admin (/admin)", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  context("when the user is not logged in", () => {
    it("redirects to the login page", () => {
      cy.request({
        url: "/admin",
        followRedirect: false,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(302);
        expect(response.redirectedToUrl).to.contain("/login");
      });
    });
  });

  context("as a basic user", () => {
    beforeEach(() => {
      cy.login("basic_user");
    });

    it("loads the dashboard with the Get Started panel", () => {
      cy.request({ url: "/admin", failOnStatusCode: false })
        .its("status")
        .should("eq", 403);
    });
  });

  context("as a site admin", () => {
    beforeEach(() => {
      cy.login("site_admin");
    });

    it("loads the dashboard", () => {
      cy.visit("/admin");
      cy.contains("Get Started").should("be.visible");
    });
  });

  context("as a super admin", () => {
    beforeEach(() => {
      cy.login("admin");
    });

    it("loads the dashboard", () => {
      cy.visit("/admin");
      cy.contains("Get Started").should("be.visible");
    });
  });
});
