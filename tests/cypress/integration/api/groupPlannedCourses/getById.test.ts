import * as api from "../../../support/api";
import { ApiPlannedCourse } from "../../../../../resources/js/types";

describe("GET /api/group/:groupId/planned-courses/:courseId", () => {
  let plannedCourse = null as ApiPlannedCourse | null;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    // add some planned courses to group 1
    cy.create("App\\PlannedCourse", 10, {
      group_id: 1,
    }).then((courses) => {
      plannedCourse = courses[0];
    });
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .get(
          `/api/group/${plannedCourse.group_id}/planned-courses/${plannedCourse.id}`,
          {
            failOnStatusCode: false,
          },
        )
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
        .get(
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

  context("as a user that can 'view planned courses'", () => {
    beforeEach(() => {
      cy.givePermissionToUser("view planned courses", "view_user");
      cy.login("view_user");
    });

    it("returns the planned course with group", () => {
      api
        .get(
          `/api/group/${plannedCourse.group_id}/planned-courses/${plannedCourse.id}`,
          {
            failOnStatusCode: false,
          },
        )
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.keys([
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

    it("404s when the planned course does not exist", () => {
      api
        .get(`/api/group/${plannedCourse.group_id}/planned-courses/999`, {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(404);
        });
    });

    it("404s when the planned course is not in the group", () => {
      const invalidGroupId = plannedCourse.group_id + 1;
      api
        .get(
          `/api/group/${invalidGroupId}/planned-courses/${plannedCourse.id}`,
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
