import * as api from "../../../support/api";

const validPlannedCourse = {
  subject: "TEST",
  catalog_number: "123W",
  title: "Test Course",
  course_type: "LEC",
  course_level: "UGRD",
  user_id: 1,
  term_id: 1,
  group_id: 1,
};

describe("POST /api/group/:groupId/planned-courses", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .post("/api/group/1/planned-courses", validPlannedCourse, {
          failOnStatusCode: false,
        })
        .its("status")
        .should("eq", 401);
    });
  });

  context("as a user that can 'view planned courses'", () => {
    beforeEach(() => {
      cy.givePermissionToUser("view planned courses", "view_user");
      cy.login("view_user");
    });

    it("does not allow planned course creation", () => {
      api
        .post("/api/group/1/planned-courses", validPlannedCourse, {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });

  context('as a user that can "edit planned courses"', () => {
    beforeEach(() => {
      // group admins should havve a role
      // that can edit planned courses
      cy.login("group_admin");
    });

    it("creates a new planned course", () => {
      api
        .post("/api/group/1/planned-courses", validPlannedCourse)
        .then((response) => {
          expect(response.status).to.eq(201);
          const plannedCourse = response.body;
          expect(plannedCourse).to.have.keys([
            "id",
            "subject",
            "catalog_number",
            "title",
            "course_type",
            "course_level",
            "user_id",
            "term_id",
            "created_at",
            "updated_at",
          ]);
        });
    });
  });
});
