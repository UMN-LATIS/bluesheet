import api from "../../../support/api";
import { ApiPlannedCourse } from "../../../../../resources/js/types";

describe("DELETE /api/group/:groupId/planned-courses/:courseId", () => {
  let plannedCourse = null as ApiPlannedCourse | null;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    // add some planned courses to group 1
    cy.create("App\\PlannedCourse", 10, {
      group_id: 1,
    }).then((plannedCourses) => {
      plannedCourse = plannedCourses[0];
    });
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .delete(
          `/api/group/${plannedCourse.group_id}/planned-courses/${plannedCourse.id}`,
          {
            failOnStatusCode: false,
          },
        )
        .its("status")
        .should("eq", 401);
    });
  });

  context("as a user without 'edit planned course' permissions", () => {
    beforeEach(() => {
      cy.login("basic_user");
    });

    it("does not allow deleting", () => {
      api
        .delete(
          `/api/group/${plannedCourse.group_id}/planned-courses/${plannedCourse.id}`,
          {
            failOnStatusCode: false,
          },
        )
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

    it("deletes a planned course", () => {
      api
        .delete(
          `/api/group/${plannedCourse.group_id}/planned-courses/${plannedCourse.id}`,
        )
        .then((response) => {
          expect(response.status).to.eq(204);
        });

      api
        .get(
          `/api/group/${plannedCourse.group_id}/planned-courses/${plannedCourse.id}`,
          {
            failOnStatusCode: false,
          },
        )
        .then((response) => {
          expect(response.status).to.eq(404);
        });
    });
  });
});
