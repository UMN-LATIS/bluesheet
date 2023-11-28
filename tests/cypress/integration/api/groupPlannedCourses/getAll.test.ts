import * as api from "../../../support/api";

describe("GET /api/group/:groupId/planned-courses", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    // add some planned courses to group 1
    cy.create("App\\PlannedCourse", 10, {
      group_id: 1,
    });
    cy.create("App\\PlannedCourse", 5, {
      group_id: 2,
    });
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .get("/api/group/1/planned-courses", {
          failOnStatusCode: false,
        })
        .its("status")
        .should("eq", 401);
    });
  });

  context("as a user that cannot view planned courses", () => {
    beforeEach(() => {
      cy.login("basic_user");
    });

    it("returns a 403", () => {
      api
        .get("/api/group/1/planned-courses", {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });

  context("as a user that can 'view planned courses'", () => {
    beforeEach(() => {
      cy.givePermissionToUser("view planned courses", "view_user");
      cy.login("view_user");
    });

    it("returns all courses within the group", () => {
      api.get("/api/group/1/planned-courses").then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.length(10);
        expect(response.body[0]).to.have.keys([
          "id",
          "subject",
          "catalog_number",
          "title",
          "course_type",
          "course_level",
          "user_id",
          "term_id",
          "group_id",
          "created_at",
          "updated_at",
        ]);
      });
    });
  });
});
